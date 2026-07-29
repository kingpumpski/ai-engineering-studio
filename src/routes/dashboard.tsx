import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AGENTS, CATEGORIES, type Agent } from "@/lib/agents-data";
import { AgentDialog } from "@/components/AgentDialog";
import { useDebounced } from "@/hooks/use-debounced";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useContainerWidth } from "@/hooks/use-container-width";
import { filterAgents } from "@/lib/filter-agents";
import { AgentCardSkeleton, AgentRowSkeleton, Skeleton } from "@/components/Skeleton";
import { count as perfCount, mark, measure, startScrollFpsSampler } from "@/lib/telemetry";

type DashSearch = {
  q?: string;
  cat?: (typeof CATEGORIES)[number];
  view?: "grid" | "table";
};

const CATSET = new Set<string>(CATEGORIES as readonly string[]);

export const Route = createFileRoute("/dashboard")({
  validateSearch: (raw: Record<string, unknown>): DashSearch => {
    const q = typeof raw.q === "string" && raw.q.length ? raw.q : undefined;
    const cat =
      typeof raw.cat === "string" && CATSET.has(raw.cat)
        ? (raw.cat as (typeof CATEGORIES)[number])
        : undefined;
    const view = raw.view === "grid" || raw.view === "table" ? raw.view : undefined;
    return { q, cat, view };
  },
  head: () => ({
    meta: [
      { title: "Agent Dashboard — Synthesis" },
      { name: "description", content: "Operate, monitor, and configure your 40-agent AI software organization from a single dashboard." },
      { property: "og:title", content: "Agent Dashboard — Synthesis" },
      { property: "og:description", content: "Operate and configure all 40 Synthesis agents from one dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const STATUS_CYCLE = ["active", "idle", "active", "active", "idle", "queued"] as const;
type Status = (typeof STATUS_CYCLE)[number];
const MODELS = ["Claude Sonnet 4.5", "GPT-5", "Gemini 2.5 Pro", "Llama 3.3", "DeepSeek R1"];
const PAGE_SIZE = 18;
const ROW_HEIGHT = 68;
const GRID_ROW_HEIGHT = 208;
const GRID_GAP = 12;

function statusFor(id: number): Status {
  return STATUS_CYCLE[id % STATUS_CYCLE.length];
}
function modelFor(id: number) {
  return MODELS[id % MODELS.length];
}
function loadFor(id: number) {
  return ((id * 37) % 90) + 5;
}

function Dashboard() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard" });

  const cat = search.cat ?? "All";
  const view = search.view ?? "table";
  const [q, setQ] = useState(search.q ?? "");
  const dq = useDebounced(q, 150);
  const [open, setOpen] = useState<Agent | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<string>("");

  // Telemetry: mount → ready duration + render count.
  useEffect(() => {
    mark("dashboard.mount");
    const t = setTimeout(() => {
      setReady(true);
      const dur = measure("dashboard.ready", "dashboard.mount");
      // eslint-disable-next-line no-console
      console.debug(`[perf] dashboard ready in ${dur.toFixed(0)}ms`);
    }, 120);
    return () => clearTimeout(t);
  }, []);
  perfCount("dashboard.render");

  // Keep URL in sync with debounced query (avoid navigating on every keystroke).
  useEffect(() => {
    const next: DashSearch = {
      q: dq || undefined,
      cat: cat === "All" ? undefined : cat,
      view: view === "table" ? undefined : view,
    };
    // Only navigate when something actually changed.
    if (next.q === search.q && next.cat === search.cat && next.view === search.view) return;
    navigate({ search: next, replace: true });
  }, [dq, cat, view, navigate, search.q, search.cat, search.view]);

  const setCat = (c: (typeof CATEGORIES)[number]) =>
    navigate({ search: (s: DashSearch) => ({ ...s, cat: c === "All" ? undefined : c }), replace: false });
  const setView = (v: "grid" | "table") =>
    navigate({ search: (s: DashSearch) => ({ ...s, view: v === "table" ? undefined : v }), replace: false });

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString());
    tick();
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (id == null) id = setInterval(tick, 1000);
    };
    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = undefined;
      }
    };
    start();
    const onVis = () => (document.hidden ? stop() : (tick(), start()));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const filtered = useMemo(() => filterAgents(cat, dq), [cat, dq]);
  const { visible, hasMore, sentinelRef, loadMore, prefetchNext, total } =
    useInfiniteList(filtered, PAGE_SIZE);

  const stats = useMemo(() => {
    const active = AGENTS.filter((a) => statusFor(a.id) === "active").length;
    const idle = AGENTS.filter((a) => statusFor(a.id) === "idle").length;
    const queued = AGENTS.filter((a) => statusFor(a.id) === "queued").length;
    const byCat = CATEGORIES.filter((c) => c !== "All").map((c) => ({
      c,
      n: AGENTS.filter((a) => a.category === c).length,
    }));
    return { active, idle, queued, byCat, total: AGENTS.length };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm sm:text-base">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Icons.Hexagon className="size-4 text-background" strokeWidth={2.5} />
            </div>
            <span className="hidden xs:inline">Synthesis</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="story-link">Home</Link>
            <Link to="/dashboard" className="story-link text-foreground">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg glass hover:bg-secondary/60 transition flex items-center gap-1.5">
              <Icons.RefreshCw className="size-3.5" /> <span className="hidden sm:inline">Sync</span>
            </button>
            <button className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-1.5">
              <Icons.Play className="size-3.5" /> <span className="hidden sm:inline">Run task</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-3">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest">Control room</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">Agent dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Live status, load, and configuration for every agent in your org.</p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2" aria-live="polite">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Orchestrator online{now && ` · ${now}`}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {ready ? (
            <>
              <StatCard label="Total agents" value={stats.total} icon={Icons.Users} tone="primary" />
              <StatCard label="Active" value={stats.active} icon={Icons.Activity} tone="accent" />
              <StatCard label="Idle" value={stats.idle} icon={Icons.Moon} />
              <StatCard label="Queued" value={stats.queued} icon={Icons.Clock} />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-xl" />)
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Category distribution</h3>
              <Icons.PieChart className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {ready
                ? stats.byCat.map((row) => {
                    const pct = Math.round((row.n / stats.total) * 100);
                    return (
                      <div key={row.c}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{row.c}</span>
                          <span className="text-muted-foreground font-mono">{row.n} · {pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent activity</h3>
              <Icons.Rss className="size-4 text-muted-foreground" />
            </div>
            {ready ? (
              <ul className="space-y-3 text-xs">
                {AGENTS.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.name}</p>
                      <p className="text-muted-foreground truncate">completed task · {(a.id * 3) % 60}s ago</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4" role="toolbar" aria-label="Agent filters">
          <div className="relative flex-1 min-w-[180px] sm:max-w-sm">
            <Icons.Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agents…"
              aria-label="Search agents"
              className="w-full pl-9 pr-3 py-2 rounded-lg glass text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 order-3 sm:order-none w-full sm:w-auto" role="group" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  cat === c ? "bg-primary text-primary-foreground border-primary" : "glass hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto flex rounded-lg glass overflow-hidden" role="group" aria-label="View mode">
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "table" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icons.List className="size-3.5" /> <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icons.LayoutGrid className="size-3.5" /> <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span aria-live="polite">
            Showing <span className="font-mono text-foreground">{visible.length}</span> of{" "}
            <span className="font-mono text-foreground">{total}</span>
          </span>
          {hasMore && (
            <button
              onClick={() => {
                loadMore();
                prefetchNext();
              }}
              onMouseEnter={prefetchNext}
              onFocus={prefetchNext}
              className="text-primary hover:underline"
            >
              Load more
            </button>
          )}
        </div>

        {!ready ? (
          <ListSkeleton view={view} />
        ) : view === "table" ? (
          <VirtualTable items={visible} onOpen={setOpen} onNearEnd={prefetchNext} />
        ) : (
          <VirtualGrid items={visible} onOpen={setOpen} onNearEnd={prefetchNext} />
        )}

        {hasMore && (
          <div
            ref={sentinelRef}
            className="h-12 mt-4 grid place-items-center text-xs text-muted-foreground"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Loading more agents…
            </div>
          </div>
        )}

        {ready && filtered.length === 0 && (
          <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground mt-4">
            No agents match your filters.
          </div>
        )}
      </div>

      <AgentDialog agent={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/* ---------- Keyboard nav helper (roving tabindex) ---------- */

function useRovingFocus(count: number, cols: number) {
  const [focus, setFocus] = useState(0);
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      let next = focus;
      switch (e.key) {
        case "ArrowRight": next = Math.min(count - 1, focus + 1); break;
        case "ArrowLeft":  next = Math.max(0, focus - 1); break;
        case "ArrowDown":  next = Math.min(count - 1, focus + cols); break;
        case "ArrowUp":    next = Math.max(0, focus - cols); break;
        case "Home":       next = 0; break;
        case "End":        next = count - 1; break;
        default: return;
      }
      e.preventDefault();
      setFocus(next);
    },
    [focus, count, cols],
  );
  return { focus, setFocus, onKey };
}

/* ---------- Virtualized table ---------- */

function VirtualTable({
  items, onOpen, onNearEnd,
}: { items: Agent[]; onOpen: (a: Agent) => void; onNearEnd: () => void }) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const isCompact = width > 0 && width < 720;
  const parentRef = ref;
  const rowsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const { focus, setFocus, onKey } = useRovingFocus(items.length, 1);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    perfCount("virtual.table.mount");
    const el = parentRef.current;
    if (!el) return;
    return startScrollFpsSampler(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch when the last virtual item is within 3 rows of the end.
  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= items.length - 3) onNearEnd();
  }, [virtualItems, items.length, onNearEnd]);

  useEffect(() => {
    rowsRef.current[focus]?.focus({ preventScroll: false });
    virtualizer.scrollToIndex(focus, { align: "auto" });
  }, [focus, virtualizer]);

  perfCount("virtual.table.render", virtualItems.length);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div
        className="hidden sm:grid text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40 px-4 py-3 font-medium"
        style={{ gridTemplateColumns: isCompact ? "1fr auto" : "2fr 1fr 1.2fr 1.2fr 0.8fr auto" }}
        role="presentation"
      >
        <div>Agent</div>
        {!isCompact && <div>Category</div>}
        {!isCompact && <div>Model</div>}
        {!isCompact && <div>Load</div>}
        {!isCompact && <div>Status</div>}
        <div className="text-right">Actions</div>
      </div>

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: "min(70vh, 640px)", contain: "strict" }}
        role="table"
        aria-label="Agents"
        aria-rowcount={items.length}
        onKeyDown={onKey}
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
          role="rowgroup"
        >
          {virtualItems.map((v) => {
            const a = items[v.index];
            if (!a) return null;
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
            const st = statusFor(a.id);
            const load = loadFor(a.id);
            const isFocused = focus === v.index;
            return (
              <div
                key={a.id}
                data-index={v.index}
                ref={(el) => {
                  virtualizer.measureElement(el);
                  rowsRef.current[v.index] = el;
                }}
                role="row"
                aria-rowindex={v.index + 1}
                tabIndex={isFocused ? 0 : -1}
                onFocus={() => setFocus(v.index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(a);
                  }
                }}
                className="absolute left-0 right-0 border-t border-border/60 hover:bg-secondary/30 focus:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                style={{ transform: `translateY(${v.start}px)` }}
              >
                <div
                  className="grid items-center gap-3 px-4 py-3"
                  style={{ gridTemplateColumns: isCompact ? "1fr auto" : "2fr 1fr 1.2fr 1.2fr 0.8fr auto" }}
                >
                  <button onClick={() => onOpen(a)} className="flex items-center gap-3 text-left min-w-0" role="gridcell" tabIndex={-1}>
                    <div className="size-8 shrink-0 rounded-lg grid place-items-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                      <Icon className="size-4 text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium leading-tight text-sm truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.role}
                        {isCompact && <span className="ml-2 font-mono">· {modelFor(a.id)}</span>}
                      </div>
                    </div>
                  </button>
                  {!isCompact && (
                    <div className="text-xs" role="cell">
                      <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">{a.category}</span>
                    </div>
                  )}
                  {!isCompact && <div className="text-xs font-mono text-muted-foreground truncate" role="cell">{modelFor(a.id)}</div>}
                  {!isCompact && (
                    <div className="flex items-center gap-2" role="cell">
                      <div className="h-1.5 flex-1 max-w-[100px] rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${load}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8">{load}%</span>
                    </div>
                  )}
                  {!isCompact && <div role="cell"><StatusPill s={st} /></div>}
                  <div className="text-right" role="cell">
                    <div className="inline-flex gap-1">
                      {!isCompact && (
                        <>
                          <IconBtn title="Run" onClick={() => onOpen(a)}><Icons.Play className="size-3.5" /></IconBtn>
                          <IconBtn title="Configure" onClick={() => onOpen(a)}><Icons.Settings2 className="size-3.5" /></IconBtn>
                        </>
                      )}
                      <IconBtn title="Open" onClick={() => onOpen(a)}><Icons.ArrowUpRight className="size-3.5" /></IconBtn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Virtualized responsive grid ---------- */

function VirtualGrid({
  items, onOpen, onNearEnd,
}: { items: Agent[]; onOpen: (a: Agent) => void; onNearEnd: () => void }) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const rowCount = Math.ceil(items.length / cols);
  const parentRef = ref;
  const cellsRef = useRef<Record<number, HTMLButtonElement | null>>({});
  const { focus, setFocus, onKey } = useRovingFocus(items.length, cols);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GRID_ROW_HEIGHT + GRID_GAP,
    overscan: 4,
  });

  useEffect(() => {
    perfCount("virtual.grid.mount");
    const el = parentRef.current;
    if (!el) return;
    return startScrollFpsSampler(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const virtualItems = virtualizer.getVirtualItems();
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= rowCount - 2) onNearEnd();
  }, [virtualItems, rowCount, onNearEnd]);

  useEffect(() => {
    cellsRef.current[focus]?.focus({ preventScroll: false });
    const row = Math.floor(focus / cols);
    virtualizer.scrollToIndex(row, { align: "auto" });
  }, [focus, cols, virtualizer]);

  perfCount("virtual.grid.render", virtualItems.length);

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: "min(70vh, 720px)", contain: "strict" }}
      role="grid"
      aria-label="Agents"
      aria-rowcount={rowCount}
      aria-colcount={cols}
      onKeyDown={onKey}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualItems.map((v) => {
          const rowItems = items.slice(v.index * cols, v.index * cols + cols);
          return (
            <div
              key={v.key}
              role="row"
              aria-rowindex={v.index + 1}
              className="absolute left-0 right-0 grid"
              style={{
                transform: `translateY(${v.start}px)`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: GRID_GAP,
                paddingBottom: GRID_GAP,
              }}
            >
              {rowItems.map((a, colIdx) => {
                const flatIdx = v.index * cols + colIdx;
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
                const st = statusFor(a.id);
                const load = loadFor(a.id);
                const isFocused = focus === flatIdx;
                return (
                  <button
                    key={a.id}
                    ref={(el) => { cellsRef.current[flatIdx] = el; }}
                    role="gridcell"
                    aria-colindex={colIdx + 1}
                    tabIndex={isFocused ? 0 : -1}
                    onFocus={() => setFocus(flatIdx)}
                    onClick={() => onOpen(a)}
                    className="agent-card glass text-left rounded-xl p-4 flex flex-col gap-3 h-[196px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 shrink-0 rounded-lg grid place-items-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                          <Icon className="size-5 text-primary" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm leading-tight truncate">{a.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.role}</div>
                        </div>
                      </div>
                      <StatusPill s={st} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{a.summary}</p>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                        <span className="truncate">{modelFor(a.id)}</span>
                        <span>{load}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${load}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Skeletons for initial load ---------- */

function ListSkeleton({ view }: { view: "grid" | "table" }) {
  if (view === "table") {
    return (
      <div className="glass rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => <AgentRowSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
    </div>
  );
}

/* ---------- Bits ---------- */

function StatCard({
  label, value, icon: Icon, tone = "default",
}: { label: string; value: number; icon: Icons.LucideIcon; tone?: "default" | "primary" | "accent" }) {
  const ring = tone === "primary" ? "from-primary/30 to-primary/5" : tone === "accent" ? "from-accent/30 to-accent/5" : "from-secondary to-secondary/40";
  return (
    <div className="agent-card glass rounded-xl p-4 flex items-center gap-3">
      <div className={`size-10 rounded-lg grid place-items-center bg-gradient-to-br ${ring} border border-border`}>
        <Icon className="size-5 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function StatusPill({ s }: { s: Status }) {
  const map = {
    active: { c: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", d: "bg-emerald-400" },
    idle: { c: "bg-muted text-muted-foreground border-border", d: "bg-muted-foreground" },
    queued: { c: "bg-amber-500/15 text-amber-400 border-amber-500/30", d: "bg-amber-400" },
  }[s];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${map.c}`}>
      <span className={`size-1.5 rounded-full ${map.d} ${s === "active" ? "animate-pulse" : ""}`} />
      {s}
    </span>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="size-7 grid place-items-center rounded-md hover:bg-secondary transition text-muted-foreground hover:text-foreground">
      {children}
    </button>
  );
}
