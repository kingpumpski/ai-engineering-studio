import { useEffect, useRef, useState, type RefObject } from "react";

export function useInfiniteList<T>(items: T[], pageSize = 24): {
  visible: T[];
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  loadMore: () => void;
  total: number;
} {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when filtered list changes
  useEffect(() => {
    setCount(pageSize);
  }, [items, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + pageSize, items.length));
        }
      },
      { rootMargin: "600px 0px" },
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
    total: items.length,
  };
}
