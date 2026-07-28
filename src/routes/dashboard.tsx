import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AGENTS, CATEGORIES, type Agent } from "@/lib/agents-data";
import { AgentDialog } from "@/components/AgentDialog";
import { useDebounced } from "@/hooks/use-debounced";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useContainerWidth } from "@/hooks/use-container-width";
import { filterAgents } from "@/lib/filter-agents";
import { AgentCardSkeleton, AgentRowSkeleton, Skeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/dashboard")({
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
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 150);
  const [open, setOpen] = useState<Agent | null>(null);
  const [view, setView] = useState<"grid" | "table">("table");
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    // brief mount transition for smooth skeleton → content fade
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

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

  // Cached across renders + navigations via module-level Map.
  const filtered = useMemo(() => filterAgents(cat, dq), [cat, dq]);
  const { visible, hasMore, sentinelRef, loadMore, total } = useInfiniteList(filtered, PAGE_SIZE);

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
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Orchestrator online{now && ` · ${now}`}
          </div>
        </div>

        {/* STAT CARDS */}
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

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px] sm:max-w-sm">
            <Icons.Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agents…"
              className="w-full pl-9 pr-3 py-2 rounded-lg glass text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 order-3 sm:order-none w-full sm:w-auto">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  cat === c ? "bg-primary text-primary-foreground border-primary" : "glass hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ml-auto flex rounded-lg glass overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "table" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icons.List className="size-3.5" /> <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icons.LayoutGrid className="size-3.5" /> <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* RESULT META */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>
            Showing <span className="font-mono text-foreground">{visible.length}</span> of{" "}
            <span className="font-mono text-foreground">{total}</span>
          </span>
          {hasMore && (
            <button onClick={loadMore} className="text-primary hover:underline">Load more</button>
          )}
        </div>

        {/* LIST */}
        {!ready ? (
          <ListSkeleton view={view} />
        ) : view === "table" ? (
          <VirtualTable items={visible} onOpen={setOpen} />
        ) : (
          <VirtualGrid items={visible} onOpen={setOpen} />
        )}

        {/* SENTINEL for infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="h-12 mt-4 grid place-items-center text-xs text-muted-foreground">
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

/* ---------- Virtualized table ---------- */

function VirtualTable({ items, onOpen }: { items: Agent[]; onOpen: (a: Agent) => void }) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const isCompact = width > 0 && width < 720;
  const parentRef = ref;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* header (kept outside scroll for stickiness) */}
      <div
        className="hidden sm:grid text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40 px-4 py-3 font-medium"
        style={{ gridTemplateColumns: isCompact ? "1fr auto" : "2fr 1fr 1.2fr 1.2fr 0.8fr auto" }}
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
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
          {virtualizer.getVirtualItems().map((v) => {
            const a = items[v.index];
            if (!a) return null;
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
            const st = statusFor(a.id);
            const load = loadFor(a.id);
            return (
              <div
                key={a.id}
                data-index={v.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 right-0 border-t border-border/60 hover:bg-secondary/30 transition-colors"
                style={{ transform: `translateY(${v.start}px)` }}
              >
                <div
                  className="grid items-center gap-3 px-4 py-3"
                  style={{ gridTemplateColumns: isCompact ? "1fr auto" : "2fr 1fr 1.2fr 1.2fr 0.8fr auto" }}
                >
                  <button onClick={() => onOpen(a)} className="flex items-center gap-3 text-left min-w-0">
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
                    <div className="text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">{a.category}</span>
                    </div>
                  )}
                  {!isCompact && <div className="text-xs font-mono text-muted-foreground truncate">{modelFor(a.id)}</div>}
                  {!isCompact && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 max-w-[100px] rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${load}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8">{load}%</span>
                    </div>
                  )}
                  {!isCompact && <div><StatusPill s={st} /></div>}
                  <div className="text-right">
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

function VirtualGrid({ items, onOpen }: { items: Agent[]; onOpen: (a: Agent) => void }) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1;
  const rowCount = Math.ceil(items.length / cols);
  const parentRef = ref;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GRID_ROW_HEIGHT + GRID_GAP,
    overscan: 4,
  });

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: "min(70vh, 720px)", contain: "strict" }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((v) => {
          const rowItems = items.slice(v.index * cols, v.index * cols + cols);
          return (
            <div
              key={v.key}
              className="absolute left-0 right-0 grid"
              style={{
                transform: `translateY(${v.start}px)`,
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: GRID_GAP,
                paddingBottom: GRID_GAP,
              }}
            >
              {rowItems.map((a) => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
                const st = statusFor(a.id);
                const load = loadFor(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => onOpen(a)}
                    className="agent-card glass text-left rounded-xl p-4 flex flex-col gap-3 h-[196px]"
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
