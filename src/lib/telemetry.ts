/**
 * Lightweight performance telemetry. Zero deps. No network. Exposed on
 * window.__perf for ad-hoc inspection from the browser console.
 */

type Counters = Record<string, number>;
type Marks = Record<string, number>;

const counters: Counters = {};
const marks: Marks = {};
const measures: Record<string, number> = {};
let fpsRunning = false;
let fpsSamples: number[] = [];
let fpsRaf: number | null = null;
let fpsTimeout: ReturnType<typeof setTimeout> | null = null;

export function count(name: string, delta = 1) {
  counters[name] = (counters[name] ?? 0) + delta;
}

export function mark(name: string) {
  marks[name] = typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function measure(name: string, fromMark: string) {
  const start = marks[fromMark];
  if (start == null) return 0;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const dur = now - start;
  measures[name] = dur;
  return dur;
}

/**
 * Sample scroll FPS for `windowMs` after a scroll event. Debounced so a long
 * scroll produces one continuous sample. Never runs on the server.
 */
export function startScrollFpsSampler(el: HTMLElement, windowMs = 1200) {
  if (typeof window === "undefined") return () => {};
  const onScroll = () => {
    if (!fpsRunning) startSampling(windowMs);
    if (fpsTimeout) clearTimeout(fpsTimeout);
    fpsTimeout = setTimeout(stopSampling, windowMs);
  };
  el.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    el.removeEventListener("scroll", onScroll);
    stopSampling();
  };
}

function startSampling(_windowMs: number) {
  fpsRunning = true;
  fpsSamples = [];
  let last = performance.now();
  const loop = (t: number) => {
    const dt = t - last;
    last = t;
    if (dt > 0) fpsSamples.push(1000 / dt);
    if (fpsRunning) fpsRaf = requestAnimationFrame(loop);
  };
  fpsRaf = requestAnimationFrame(loop);
}

function stopSampling() {
  fpsRunning = false;
  if (fpsRaf != null) cancelAnimationFrame(fpsRaf);
  fpsRaf = null;
  if (fpsSamples.length) {
    const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
    const min = Math.min(...fpsSamples);
    measures["scroll.fps.avg"] = Math.round(avg);
    measures["scroll.fps.min"] = Math.round(min);
  }
}

export function snapshot() {
  return {
    counters: { ...counters },
    marks: { ...marks },
    measures: { ...measures },
  };
}

if (typeof window !== "undefined") {
  (window as unknown as { __perf?: unknown }).__perf = {
    snapshot,
    count,
    mark,
    measure,
  };
}
