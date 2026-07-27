import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AGENTS, CATEGORIES, type Agent } from "@/lib/agents-data";
import { AgentDialog } from "@/components/AgentDialog";

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
  const [open, setOpen] = useState<Agent | null>(null);
  const [view, setView] = useState<"grid" | "table">("table");

  const filtered = useMemo(
    () =>
      AGENTS.filter((a) => {
        const okCat = cat === "All" || a.category === cat;
        const s = q.toLowerCase();
        const okQ =
          !s ||
          a.name.toLowerCase().includes(s) ||
          a.role.toLowerCase().includes(s) ||
          a.summary.toLowerCase().includes(s);
        return okCat && okQ;
      }),
    [cat, q]
  );

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
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Icons.Hexagon className="size-4 text-background" strokeWidth={2.5} />
            </div>
            Synthesis
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="story-link">Home</Link>
            <Link to="/dashboard" className="story-link text-foreground">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="text-xs md:text-sm px-3 py-1.5 rounded-lg glass hover:bg-secondary/60 transition flex items-center gap-1.5">
              <Icons.RefreshCw className="size-3.5" /> Sync
            </button>
            <button className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-1.5">
              <Icons.Play className="size-3.5" /> Run task
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest">Control room</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Agent dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Live status, load, and configuration for every agent in your org.</p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Orchestrator online · {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total agents" value={stats.total} icon={Icons.Users} tone="primary" />
          <StatCard label="Active" value={stats.active} icon={Icons.Activity} tone="accent" />
          <StatCard label="Idle" value={stats.idle} icon={Icons.Moon} />
          <StatCard label="Queued" value={stats.queued} icon={Icons.Clock} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Category distribution</h3>
              <Icons.PieChart className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {stats.byCat.map((row) => {
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
              })}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent activity</h3>
              <Icons.Rss className="size-4 text-muted-foreground" />
            </div>
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
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Icons.Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agents…"
              className="w-full pl-9 pr-3 py-2 rounded-lg glass text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
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
              <Icons.List className="size-3.5" /> Table
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Icons.LayoutGrid className="size-3.5" /> Grid
            </button>
          </div>
        </div>

        {/* LIST */}
        {view === "table" ? (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Agent</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Model</th>
                    <th className="text-left px-4 py-3 font-medium">Load</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
                    const st = statusFor(a.id);
                    const load = loadFor(a.id);
                    return (
                      <tr key={a.id} className="border-t border-border/60 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => setOpen(a)} className="flex items-center gap-3 text-left">
                            <div className="size-8 rounded-lg grid place-items-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                              <Icon className="size-4 text-primary" strokeWidth={1.75} />
                            </div>
                            <div>
                              <div className="font-medium leading-tight">{a.name}</div>
                              <div className="text-xs text-muted-foreground">{a.role}</div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">{a.category}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{modelFor(a.id)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${load}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground w-8">{load}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusPill s={st} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <IconBtn title="Run" onClick={() => setOpen(a)}><Icons.Play className="size-3.5" /></IconBtn>
                            <IconBtn title="Configure" onClick={() => setOpen(a)}><Icons.Settings2 className="size-3.5" /></IconBtn>
                            <IconBtn title="Logs" onClick={() => setOpen(a)}><Icons.ScrollText className="size-3.5" /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((a) => {
              const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
              const st = statusFor(a.id);
              const load = loadFor(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setOpen(a)}
                  className="agent-card glass text-left rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg grid place-items-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                        <Icon className="size-5 text-primary" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-tight">{a.name}</div>
                        <div className="text-xs text-muted-foreground">{a.role}</div>
                      </div>
                    </div>
                    <StatusPill s={st} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.summary}</p>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                      <span>{modelFor(a.id)}</span>
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
        )}

        {filtered.length === 0 && (
          <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground mt-4">
            No agents match your filters.
          </div>
        )}
      </div>

      <AgentDialog agent={open} onClose={() => setOpen(null)} />
    </div>
  );
}

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
