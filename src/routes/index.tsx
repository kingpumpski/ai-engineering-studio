import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { CATEGORIES, CROSS_CUTTING, WORKFLOW, INTEGRATIONS, type Agent } from "@/lib/agents-data";
import { AgentCard } from "@/components/AgentCard";
import { AgentDialog } from "@/components/AgentDialog";
import { useDebounced } from "@/hooks/use-debounced";
import { filterAgents } from "@/lib/filter-agents";
import { SectionSkeleton } from "@/components/Skeleton";

// Code-split heavy below-the-fold sections so the hero paints faster.
const MCPSetup = lazy(() => import("@/components/MCPSetup").then((m) => ({ default: m.MCPSetup })));
const TeamBuilder = lazy(() => import("@/components/TeamBuilder").then((m) => ({ default: m.TeamBuilder })));
const OrchestratorDiagram = lazy(() =>
  import("@/components/OrchestratorDiagram").then((m) => ({ default: m.OrchestratorDiagram })),
);


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synthesis — AI Software Engineering Organization" },
      { name: "description", content: "A coordinated system of 40 specialized AI agents that plan, design, build, test, ship, and operate software end-to-end." },
      { property: "og:title", content: "Synthesis — AI Software Engineering Organization" },
      { property: "og:description", content: "40 specialized AI agents that behave like an experienced software company." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  component: Home,
});

function Home() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 120);
  const [open, setOpen] = useState<Agent | null>(null);

  const filtered = useMemo(() => filterAgents(cat, dq, "full"), [cat, dq]);


  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-display font-bold">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Icons.Hexagon className="size-4 text-background" strokeWidth={2.5} />
            </div>
            Synthesis
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#agents" className="story-link">Agents</a>
            <a href="#orchestrator" className="story-link">Orchestrator</a>
            <a href="#workflow" className="story-link">Workflow</a>
            <a href="#mcp" className="story-link">MCP</a>
            <a href="#builder" className="story-link">Builder</a>
            <Link to="/dashboard" className="story-link">Dashboard</Link>
            <Link to="/console" className="story-link">Console</Link>
          </nav>
          <a href="#mcp" className="text-xs md:text-sm px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
            Get started
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-6 animate-fade-in">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            40 specialized agents · one orchestrator
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] max-w-4xl mx-auto">
            An <span className="text-gradient">AI software company</span><br className="hidden md:block" /> in one system.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Synthesis is a blueprint for a coordinated agent organization — architects, engineers, testers, reviewers, and SRE — that plans, ships, and operates production software together.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#agents" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition flex items-center gap-2">
              Explore the org <Icons.ArrowRight className="size-4" />
            </a>
            <a href="#mcp" className="px-5 py-2.5 rounded-lg glass font-medium hover:bg-secondary/60 transition flex items-center gap-2">
              <Icons.Terminal className="size-4" /> Setup in your editor
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { k: "40", v: "Specialist agents" },
              { k: "35+", v: "Languages" },
              { k: "19", v: "Workflow stages" },
              { k: "10+", v: "MCP integrations" },
            ].map((s, i) => (
              <div key={s.v} className="glass rounded-xl p-4 animate-float" style={{ animationDelay: `${i * 0.25}s` }}>
                <div className="text-3xl font-bold text-gradient">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORCHESTRATOR */}
      <section id="orchestrator" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest">The hub</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">One orchestrator, many specialists</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Executive Orchestrator decomposes goals, picks the right model per task, delegates to specialists,
              detects blockers, retries failures, resolves conflicts, and merges outputs. Every specialist reports back
              through it — no crosstalk, no drift.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["Plan → delegate → monitor → merge","Per-task model routing (cost, latency, capability)","Long-term memory with indexed retrieval","Checkpoints + rollback on every major change","Human-in-the-loop for destructive operations"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Icons.CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <Suspense fallback={<SectionSkeleton height={420} />}>
            <OrchestratorDiagram />
          </Suspense>
        </div>
      </section>

      <section id="agents" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest">The org chart</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Meet the 40 agents</h2>
            <p className="text-muted-foreground mt-2 max-w-xl">Every card is a role with clear responsibilities, expertise, and configurable tools. Click any agent to open its dossier.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Icons.Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search agents, stacks, tools…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "glass hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <AgentCard key={a.id} agent={a} onOpen={setOpen} />
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Autonomous workflow</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">From idea to incident response</h2>
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent hidden md:block" />
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {WORKFLOW.map((step, i) => (
              <div key={step} className="agent-card glass rounded-xl p-3 text-center">
                <div className="size-8 mx-auto rounded-full bg-primary/10 border border-primary/30 grid place-items-center text-xs font-mono text-primary mb-2">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-xs font-medium leading-tight">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Cross-cutting</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">Capabilities every agent inherits</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CROSS_CUTTING.map((c, i) => (
            <div key={c.title} className="agent-card glass rounded-xl p-5">
              <div className="text-xs font-mono text-muted-foreground">#{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-semibold mt-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MCP */}
      <section id="mcp" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Editor integration</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-2">Setup MCP in your editor</h2>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Every agent is exposed via the Model Context Protocol. Drop these snippets into your editor of choice, add your API keys, and the agent org appears alongside your code.
        </p>
        <Suspense fallback={<SectionSkeleton height={480} />}>
          <MCPSetup />
        </Suspense>
      </section>

      {/* TEAM BUILDER */}
      <section id="builder" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Interactive</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-2">Build your team</h2>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Pick the agents your project needs, assign a model to each, and export a ready-to-run orchestrator config.
        </p>
        <Suspense fallback={<SectionSkeleton height={560} />}>
          <TeamBuilder />
        </Suspense>
      </section>

      <section id="integrations" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Ecosystem</p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">Fits your developer workflow</h2>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS.map((i) => (
            <span key={i} className="agent-card px-4 py-2 rounded-lg glass text-sm">{i}</span>
          ))}
        </div>
      </section>

      <footer className="border-t border-border mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-gradient-to-br from-primary to-accent" />
            <span>Synthesis — an AI software organization blueprint.</span>
          </div>
          <div>Built with human-in-the-loop oversight.</div>
        </div>
      </footer>

      <AgentDialog agent={open} onClose={() => setOpen(null)} />
    </div>
  );
}
