import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AGENTS, CATEGORIES, type Agent } from "@/lib/agents-data";
import { useDebounced } from "@/hooks/use-debounced";
import { filterAgents } from "@/lib/filter-agents";
import {
  createSession,
  tick,
  TICK_INTERVAL,
  CONCURRENCY,
  type RunSession,
  type AgentRun,
  type LogLine,
} from "@/lib/run-engine";

export const Route = createFileRoute("/console")({
  head: () => ({
    meta: [
      { title: "Run Console — Launch & Monitor Agents | Synthesis" },
      {
        name: "description",
        content:
          "Launch one or many Synthesis agents on a task and watch live progress, streaming logs, step-by-step tool calls, and generated outputs.",
      },
      { property: "og:title", content: "Run Console — Launch & Monitor Agents" },
      {
        property: "og:description",
        content: "Start agent runs and follow live progress, logs, and outputs in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunConsole,
});

const LEVEL_STYLE: Record<LogLine["level"], string> = {
  info: "text-muted-foreground",
  tool: "text-primary",
  warn: "text-yellow-400",
  success: "text-emerald-400",
  error: "text-destructive",
};

function Icon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Sparkles;
  return <C className={className} />;
}

function RunConsole() {
  const [objective, setObjective] = useState("Build a production-ready checkout flow with tests and docs");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [selected, setSelected] = useState<Set<number>>(new Set([1, 6, 7, 8]));
  const [session, setSession] = useState<RunSession | null>(null);
  const [paused, setPaused] = useState(false);
  const [openOutput, setOpenOutput] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const debounced = useDebounced(query, 180);
  const list = useMemo(() => filterAgents(cat, debounced, "full"), [cat, debounced]);

  const logRef = useRef<HTMLDivElement>(null);

  // Simulation loop — pauses when the tab is hidden or the run is paused.
  useEffect(() => {
    if (!session || session.endedAt || paused) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setSession((s) => (s ? tick(s) : s));
    }, TICK_INTERVAL);
    return () => window.clearInterval(id);
  }, [session?.id, session?.endedAt, paused]);

  useEffect(() => {
    if (!autoScroll || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [session?.logs.length, autoScroll]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const launch = () => {
    const agents: Agent[] = AGENTS.filter((a) => selected.has(a.id));
    if (!agents.length) return;
    setPaused(false);
    setOpenOutput(null);
    setSession(createSession(agents, objective.trim() || "Unspecified objective"));
  };

  const cancel = () =>
    setSession((s) =>
      s
        ? {
            ...s,
            endedAt: Date.now(),
            runs: s.runs.map((r) =>
              r.status === "done" ? r : { ...r, status: "cancelled" as const, endedAt: Date.now() },
            ),
          }
        : s,
    );

  const runs = session?.runs ?? [];
  const overall = runs.length ? Math.round(runs.reduce((n, r) => n + r.progress, 0) / runs.length) : 0;
  const doneCount = runs.filter((r) => r.status === "done").length;
  const activeCount = runs.filter((r) => r.status === "running").length;
  const outputRun = openOutput != null ? runs.find((r) => r.agentId === openOutput) : undefined;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/70 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm sm:text-base">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Icons.Hexagon className="size-4 text-background" strokeWidth={2.5} />
            </div>
            Synthesis
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <Link to="/" className="story-link">Home</Link>
            <Link to="/dashboard" className="story-link">Dashboard</Link>
            <Link to="/console" className="story-link text-foreground">Console</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display">Run Console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Launch one or more agents on an objective and watch progress, logs, and outputs stream in.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-1 rounded-md glass">concurrency {CONCURRENCY}</span>
            <span className="px-2 py-1 rounded-md glass">{selected.size} selected</span>
          </div>
        </div>

        <div className="grid xl:grid-cols-[340px_1fr_380px] lg:grid-cols-[320px_1fr] gap-4">
          {/* LAUNCHER */}
          <section className="glass rounded-2xl p-4 h-fit lg:sticky lg:top-20">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Icons.Rocket className="size-4 text-primary" /> Launch
            </h2>
            <label className="text-xs text-muted-foreground" htmlFor="objective">Objective</label>
            <textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              className="mt-1 w-full text-sm bg-background/60 border border-border rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Describe the task for the team…"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={launch}
                disabled={!selected.size}
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                <Icons.Play className="size-4" /> Run {selected.size || ""}
              </button>
              {session && !session.endedAt && (
                <>
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="text-sm px-3 py-2 rounded-lg glass hover:border-primary/40 transition"
                    aria-label={paused ? "Resume run" : "Pause run"}
                  >
                    {paused ? <Icons.Play className="size-4" /> : <Icons.Pause className="size-4" />}
                  </button>
                  <button
                    onClick={cancel}
                    className="text-sm px-3 py-2 rounded-lg glass hover:border-destructive/50 transition"
                    aria-label="Cancel run"
                  >
                    <Icons.Square className="size-4" />
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Icons.Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search agents"
                  aria-label="Search agents"
                  className="w-full text-xs bg-background/60 border border-border rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs px-2.5 py-1.5 rounded-lg glass hover:border-primary/40"
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition ${
                    cat === c ? "bg-primary/15 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <ul className="mt-3 max-h-[46vh] overflow-y-auto custom-scroll pr-1 space-y-1.5">
              {list.map((a) => {
                const on = selected.has(a.id);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => toggle(a.id)}
                      aria-pressed={on}
                      className={`w-full flex items-center gap-2.5 text-left rounded-lg px-2.5 py-2 border transition ${
                        on ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className={`size-7 rounded-md grid place-items-center shrink-0 ${on ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        <Icon name={a.icon} className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium truncate">{a.name}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">{a.role} · {a.category}</span>
                      </span>
                      {on && <Icons.CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {!list.length && <li className="text-xs text-muted-foreground py-6 text-center">No agents match.</li>}
            </ul>
          </section>

          {/* RUNS */}
          <section className="min-w-0">
            {!session ? (
              <EmptyState count={selected.size} />
            ) : (
              <>
                <div className="glass rounded-2xl p-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{session.id}</p>
                      <p className="text-sm font-medium truncate">{session.objective}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400">{doneCount} done</span>
                      <span className="text-primary">{activeCount} running</span>
                      <span className="text-muted-foreground">{runs.length} total</span>
                      <span className={`px-2 py-1 rounded-md ${session.endedAt ? "bg-emerald-500/15 text-emerald-400" : paused ? "bg-yellow-500/15 text-yellow-400" : "bg-primary/15 text-primary"}`}>
                        {session.endedAt ? "finished" : paused ? "paused" : "live"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${overall}%` }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {runs.map((r) => (
                    <RunCard key={r.agentId} run={r} onOpen={() => setOpenOutput(r.agentId)} />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* LOGS */}
          <section className="glass rounded-2xl p-4 h-fit xl:sticky xl:top-20 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Icons.Terminal className="size-4 text-primary" /> Live logs
              </h2>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
                auto-scroll
              </label>
            </div>
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-label="Agent run logs"
              className="bg-background/60 border border-border rounded-xl p-3 h-[60vh] overflow-y-auto custom-scroll font-mono text-[11px] leading-relaxed space-y-1"
            >
              {!session?.logs.length && <p className="text-muted-foreground">Waiting for a run…</p>}
              {session?.logs.map((l) => (
                <div key={l.id} className="flex gap-2">
                  <span className="text-muted-foreground/60 shrink-0">
                    {new Date(l.t).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className="text-muted-foreground/80 shrink-0 truncate max-w-[110px]">{l.agent}</span>
                  <span className={`${LEVEL_STYLE[l.level]} break-words min-w-0`}>{l.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {outputRun && <OutputDialog run={outputRun} onClose={() => setOpenOutput(null)} />}
    </div>
  );
}

function EmptyState({ count }: { count: number }) {
  return (
    <div className="glass rounded-2xl p-10 grid place-items-center text-center min-h-[320px]">
      <div>
        <div className="size-14 rounded-2xl mx-auto grid place-items-center bg-primary/10 border border-primary/20">
          <Icons.Rocket className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 font-semibold">No active run</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Pick agents on the left, write an objective, then hit Run. {count} agent(s) ready to launch.
        </p>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<AgentRun["status"], string> = {
  queued: "bg-secondary text-muted-foreground",
  running: "bg-primary/15 text-primary",
  done: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-yellow-500/15 text-yellow-400",
};

function RunCard({ run, onOpen }: { run: AgentRun; onOpen: () => void }) {
  return (
    <article className="glass rounded-xl p-4 hover-scale transition-all">
      <div className="flex items-start gap-3">
        <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${run.status === "running" ? "bg-primary/20 text-primary animate-pulse-glow" : "bg-secondary text-muted-foreground"}`}>
          <Icon name={run.icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{run.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${STATUS_STYLE[run.status]}`}>{run.status}</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono truncate">{run.model}</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{Math.round(run.progress)}%</span>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${run.status === "done" ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-accent"}`}
          style={{ width: `${run.progress}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1">
        {run.steps.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-[11px]">
            {s.status === "done" ? (
              <Icons.CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            ) : s.status === "running" ? (
              <Icons.Loader2 className="size-3.5 text-primary shrink-0 animate-spin" />
            ) : (
              <Icons.Circle className="size-3.5 text-muted-foreground/50 shrink-0" />
            )}
            <span className={`truncate ${s.status === "pending" ? "text-muted-foreground" : ""}`}>{s.name}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground shrink-0">{s.tool}</span>
          </li>
        ))}
      </ul>

      {run.output && (
        <button
          onClick={onOpen}
          className="mt-3 w-full text-xs px-3 py-1.5 rounded-lg glass hover:border-primary/40 transition flex items-center justify-center gap-1.5"
        >
          <Icons.FileText className="size-3.5" /> View output
        </button>
      )}
    </article>
  );
}

function OutputDialog({ run, onClose }: { run: AgentRun; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${run.name} output`}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />
      <div onClick={(e) => e.stopPropagation()} className="relative glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-scale-in shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-lg hover:bg-secondary transition" aria-label="Close">
          <Icons.X className="size-4" />
        </button>
        <h3 className="text-lg font-bold pr-10">{run.name} — output</h3>
        <p className="text-xs font-mono text-muted-foreground mt-1">{run.model}</p>
        <pre className="mt-4 bg-background/60 border border-border rounded-xl p-3 text-[11px] font-mono leading-relaxed overflow-auto whitespace-pre-wrap">
          <code>{run.output}</code>
        </pre>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(run.output ?? "");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 hover:opacity-90 transition"
          >
            {copied ? <Icons.Check className="size-3.5" /> : <Icons.Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
