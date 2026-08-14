import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { CATEGORIES, CROSS_CUTTING, WORKFLOW, INTEGRATIONS, type Agent } from "@/lib/agents-data";
import { AgentCard } from "@/components/AgentCard";
import { AgentDialog } from "@/components/AgentDialog";
import { useDebounced } from "@/hooks/use-debounced";
import { filterAgents } from "@/lib/filter-agents";
import { SectionSkeleton } from "@/components/Skeleton";

const MCPSetup = lazy(() => import("@/components/MCPSetup").then((m) => ({ default: m.MCPSetup })));
const TeamBuilder = lazy(() => import("@/components/TeamBuilder").then((m) => ({ default: m.TeamBuilder })));
const OrchestratorDiagram = lazy(() => import("@/components/OrchestratorDiagram").then((m) => ({ default: m.OrchestratorDiagram })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Work — AI Engineering Operating System" },
      { name: "description", content: "A local-first AI engineering operating system for planning, building, testing, reviewing and shipping software with coordinated specialist agents." },
      { property: "og:title", content: "Work — AI Engineering Operating System" },
      { property: "og:description", content: "Coordinate local AI agents, project memory, GitHub, CI and human approvals from one engineering workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
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
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 font-display font-bold shrink-0">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary via-accent to-primary grid place-items-center shadow-glow animate-pulse-glow">
              <Icons.Hexagon className="size-4 text-background" strokeWidth={2.7} />
            </div>
            <span className="tracking-tight">Work<span className="text-primary">.</span></span>
          </a>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#platform" className="story-link">Platform</a>
            <a href="#agents" className="story-link">Agents</a>
            <a href="#workflow" className="story-link">Workflow</a>
            <a href="#mcp" className="story-link">IDE + MCP</a>
            <Link to="/dashboard" className="story-link">Dashboard</Link>
            <Link to="/console" className="story-link">Console</Link>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#mcp" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl glass font-medium hover:bg-secondary/60 transition">Connect IDE</a>
            <a href="#agents" className="inline-flex text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition items-center gap-2">Explore <Icons.ArrowUpRight className="size-4" /></a>
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[34rem] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs mb-7 animate-fade-in">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Local-first · Human-governed · Model-agnostic
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[.96] tracking-[-.045em]">
              Your engineering team,<br /><span className="text-gradient">augmented by AI.</span>
            </h1>
            <p className="mt-7 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Work turns local models and specialist agents into a coordinated engineering system that understands your repositories, plans work, writes safely, verifies changes and collaborates with GitHub.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link to="/console" className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center gap-2 shadow-glow">Open workspace <Icons.ArrowRight className="size-4" /></Link>
              <a href="#platform" className="px-5 py-3 rounded-xl glass font-semibold hover:bg-secondary/60 transition flex items-center gap-2"><Icons.Play className="size-4" /> See how it works</a>
            </div>
          </div>

          <div className="mt-14 max-w-5xl mx-auto rounded-2xl glass p-2 shadow-card animate-pulse-glow">
            <div className="rounded-xl bg-background/80 border border-border/70 overflow-hidden">
              <div className="h-10 border-b border-border flex items-center gap-2 px-4 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-destructive/70" /><span className="size-2 rounded-full bg-yellow-400/70" /><span className="size-2 rounded-full bg-emerald-400/70" />
                <span className="ml-3 font-mono">work / engineering workspace</span>
                <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" /> Ollama ready</span>
              </div>
              <div className="grid md:grid-cols-[1.2fr_.8fr] min-h-64">
                <div className="p-5 md:p-7 font-mono text-xs md:text-sm leading-7 border-b md:border-b-0 md:border-r border-border">
                  <div><span className="text-primary">$</span> work supervisor <span className="text-muted-foreground">"build seller authentication"</span></div>
                  <div className="text-muted-foreground">→ scanning repository context</div>
                  <div className="text-muted-foreground">→ selecting requirements, architect, backend, database</div>
                  <div className="text-emerald-400">→ context ready · 18 relevant files</div>
                  <div className="text-emerald-400">→ approval gate armed</div>
                  <div className="mt-2 text-primary">● supervisor waiting for execution approval</div>
                </div>
                <div className="p-5 space-y-3">
                  {[["Repository","Indexed"],["Memory","Ready"],["Agents","14 specialists"],["CI","Connected"]].map(([a,b]) => <div key={a} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs"><span className="text-muted-foreground">{a}</span><span className="font-medium">{b}</span></div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[{k:"14+",v:"specialist roles"},{k:"Local",v:"AI-first runtime"},{k:"GitHub",v:"native workflow"},{k:"Human",v:"approval gates"}].map((s,i)=><div key={s.v} className="glass rounded-xl p-4 text-center" style={{animationDelay:`${i*.2}s`}}><div className="text-xl md:text-2xl font-bold text-gradient">{s.k}</div><div className="text-xs text-muted-foreground mt-1">{s.v}</div></div>)}
          </div>
        </div>
      </section>

      <section id="platform" className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <div className="max-w-3xl mb-10"><p className="text-xs font-mono text-primary uppercase tracking-widest">Engineering operating system</p><h2 className="text-3xl md:text-5xl font-bold mt-2">One command. An entire engineering loop.</h2><p className="text-muted-foreground mt-4 text-lg">Work connects context, agents, models, execution, verification and delivery into one governed workflow.</p></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{icon:Icons.Brain,title:"Understand",desc:"Index repositories, memory, Git history and relevant project context."},{icon:Icons.Network,title:"Orchestrate",desc:"Route work to requirements, architecture, coding, security and QA specialists."},{icon:Icons.ShieldCheck,title:"Build safely",desc:"Sandbox changes, enforce approval gates and keep destructive actions controlled."},{icon:Icons.Rocket,title:"Ship",desc:"Verify locally, understand CI failures and prepare GitHub delivery."}].map((c)=><div key={c.title} className="agent-card glass rounded-2xl p-6"><div className="size-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center mb-5"><c.icon className="size-5 text-primary agent-icon" /></div><h3 className="text-lg font-semibold">{c.title}</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.desc}</p></div>)}
        </div>
      </section>

      <section id="orchestrator" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center"><div><p className="text-xs font-mono text-primary uppercase tracking-widest">The control plane</p><h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">One supervisor. Many specialists. One source of truth.</h2><p className="text-muted-foreground leading-relaxed">The orchestrator decomposes goals, selects specialists, supplies focused context, routes model work and keeps humans in control of consequential changes.</p><ul className="mt-6 space-y-2.5">{["Plan → delegate → monitor → verify → review","Task-aware context instead of repository-sized prompts","Local Ollama by default, provider-agnostic by design","Persistent project memory and engineering decisions","Human approval for repository writes and delivery"].map((f)=><li key={f} className="flex items-start gap-2.5 text-sm"><Icons.CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" /><span>{f}</span></li>)}</ul></div><Suspense fallback={<SectionSkeleton height={420} />}><OrchestratorDiagram /></Suspense></div>
      </section>

      <section id="agents" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><p className="text-xs font-mono text-primary uppercase tracking-widest">Specialist network</p><h2 className="text-3xl md:text-4xl font-bold mt-2">Build your AI engineering team</h2><p className="text-muted-foreground mt-2 max-w-xl">Compose a team around your project's needs. Every role has explicit capabilities, responsibilities and model preferences.</p></div><div className="relative w-full md:w-80"><Icons.Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search agents, stacks, tools…" aria-label="Search agents" className="w-full pl-9 pr-3 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></div></div>
        <div className="flex flex-wrap gap-2 mb-8">{CATEGORIES.map((c)=><button key={c} onClick={()=>setCat(c)} className={`text-xs px-3.5 py-1.5 rounded-full border transition ${cat===c?"bg-primary text-primary-foreground border-primary":"glass hover:border-primary/40"}`}>{c}</button>)}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filtered.map((a)=><AgentCard key={a.id} agent={a} onOpen={setOpen} />)}</div>
      </section>

      <section id="workflow" className="max-w-7xl mx-auto px-4 md:px-6 py-20"><p className="text-xs font-mono text-primary uppercase tracking-widest">Delivery pipeline</p><h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">From idea to verified delivery</h2><div className="relative"><div className="absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent hidden md:block" /><div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">{WORKFLOW.map((step,i)=><div key={step} className="agent-card glass rounded-xl p-3 text-center"><div className="size-8 mx-auto rounded-full bg-primary/10 border border-primary/30 grid place-items-center text-xs font-mono text-primary mb-2">{String(i+1).padStart(2,"0")}</div><div className="text-xs font-medium leading-tight">{step}</div></div>)}</div></div></section>

      <section id="capabilities" className="max-w-7xl mx-auto px-4 md:px-6 py-20"><p className="text-xs font-mono text-primary uppercase tracking-widest">Platform capabilities</p><h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">Designed for serious engineering</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{CROSS_CUTTING.map((c,i)=><div key={c.title} className="agent-card glass rounded-xl p-5"><div className="text-xs font-mono text-muted-foreground">#{String(i+1).padStart(2,"0")}</div><h3 className="font-semibold mt-1">{c.title}</h3><p className="text-sm text-muted-foreground mt-1.5">{c.desc}</p></div>)}</div></section>

      <section id="mcp" className="max-w-7xl mx-auto px-4 md:px-6 py-20"><div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 md:p-10"><p className="text-xs font-mono text-primary uppercase tracking-widest">IDE anywhere</p><div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center"><div><h2 className="text-3xl md:text-4xl font-bold mt-2">Bring Work into your editor</h2><p className="text-muted-foreground max-w-2xl mt-3">Connect through MCP and use the same engineering intelligence from VS Code, Codespaces, terminals and future IDE integrations.</p></div><a href="#setup" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">Configure MCP <Icons.Terminal className="size-4" /></a></div><div id="setup" className="mt-8"><Suspense fallback={<SectionSkeleton height={480} />}><MCPSetup /></Suspense></div></div></section>

      <section id="builder" className="max-w-7xl mx-auto px-4 md:px-6 py-20"><p className="text-xs font-mono text-primary uppercase tracking-widest">Interactive</p><h2 className="text-3xl md:text-4xl font-bold mt-2 mb-2">Assemble a team for your project</h2><p className="text-muted-foreground max-w-2xl mb-8">Select specialists, assign models and export a ready-to-run orchestration configuration.</p><Suspense fallback={<SectionSkeleton height={560} />}><TeamBuilder /></Suspense></section>

      <section id="integrations" className="max-w-7xl mx-auto px-4 md:px-6 py-20"><p className="text-xs font-mono text-primary uppercase tracking-widest">Ecosystem</p><h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">Fits the tools your team already uses</h2><div className="flex flex-wrap gap-2">{INTEGRATIONS.map((i)=><span key={i} className="agent-card px-4 py-2 rounded-lg glass text-sm">{i}</span>)}</div></section>

      <footer className="border-t border-border mt-10"><div className="max-w-7xl mx-auto px-4 md:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground"><div className="flex items-center gap-2"><div className="size-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center"><Icons.Hexagon className="size-3.5 text-background" /></div><span>Work — AI Engineering Operating System.</span></div><div>Local-first by default · Human-governed by design.</div></div></footer>
      <AgentDialog agent={open} onClose={()=>setOpen(null)} />
    </div>
  );
}
