import { useEffect, useRef, useState, type RefObject } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
};

export function useInfiniteList<T>(items: T[], pageSize = 24): {
  visible: T[];
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  loadMore: () => void;
  prefetchNext: () => void;
  total: number;
} {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prefetchedRef = useRef(0);

  // Reset when filtered list changes
  useEffect(() => {
    setCount(pageSize);
    prefetchedRef.current = 0;
  }, [items, pageSize]);

  // Prefetch the next slice during idle time so the sentinel-trigger paint is
  // effectively instant. Data is in-memory, so "prefetch" here means priming
  // the reference to the next slice + a synchronous touch so V8 keeps it hot.
  const prefetchNext = () => {
    const next = Math.min(count + pageSize, items.length);
    if (next <= prefetchedRef.current) return;
    prefetchedRef.current = next;
    const win = typeof window !== "undefined" ? (window as IdleWindow) : undefined;
    const run = () => {
      // Touch the slice to keep it in cache; result intentionally unused.
      void items.slice(count, next).length;
    };
    if (win?.requestIdleCallback) win.requestIdleCallback(run, { timeout: 250 });
    else if (typeof setTimeout !== "undefined") setTimeout(run, 0);
  };

  useEffect(() => {
    prefetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, items]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + pageSize, items.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, pageSize]);

  const visible = items.slice(0, count);
  return {
    visible,
    hasMore: count < items.length,
    sentinelRef,
    loadMore: () => setCount((c) => Math.min(c + pageSize, items.length)),
    prefetchNext,
    total: items.length,
  };
}
