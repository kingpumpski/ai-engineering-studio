import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useMemo, useState } from "react";
import { AGENTS, CATEGORIES } from "@/lib/agents-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Engineering Command Center — Work" },
    { name: "description", content: "Monitor AI engineering workspaces, agents, runs, model health and delivery signals." },
  ]}),
  component: Dashboard,
});

const nav = [
  ["Overview", Icons.LayoutDashboard], ["Projects", Icons.FolderKanban], ["Tasks", Icons.ListTodo],
  ["Agents", Icons.Bot], ["Runs", Icons.Activity], ["Memory", Icons.BrainCircuit],
  ["GitHub", Icons.GitBranch], ["CI / CD", Icons.GitPullRequest], ["Models", Icons.Cpu],
] as const;

function Dashboard() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => AGENTS.filter(a => `${a.name} ${a.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [query]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="h-16 max-w-[1600px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold">
            <span className="size-8 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-lg shadow-primary/15"><Icons.Hexagon className="size-4 text-background" /></span>
            <span>Work</span><span className="hidden sm:inline text-muted-foreground font-normal">/ Command Center</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground"><span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> OLLAMA ONLINE <span className="opacity-40">•</span> deepseek-coder</div>
          <div className="flex items-center gap-2"><button className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition"><Icons.Settings className="size-4" /></button><Link to="/console" className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition flex items-center gap-2"><Icons.Play className="size-3.5" /> New run</Link></div>
        </div>
      </header>
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-[220px_1fr] min-h-[calc(100vh-4rem)]">
        <aside className="hidden lg:block border-r border-border/60 py-6 pr-4">
          <div className="px-3 mb-3 text-[10px] uppercase tracking-[.18em] text-muted-foreground">Workspace</div>
          <nav className="space-y-1">{nav.map(([label, I]) => <button key={label} onClick={() => setActive(label)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${active === label ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><I className="size-4" />{label}</button>)}</nav>
          <div className="mt-8 p-3 rounded-xl border border-border bg-card/50"><div className="text-xs font-medium mb-1">Workspace health</div><div className="text-[11px] text-muted-foreground mb-3">Local-first runtime</div><div className="h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full w-[94%] bg-gradient-to-r from-primary to-accent" /></div><div className="flex justify-between mt-2 text-[10px] text-muted-foreground"><span>Healthy</span><span>94%</span></div></div>
        </aside>
        <main className="p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 mb-7">
            <div><div className="text-[11px] font-mono uppercase tracking-[.2em] text-primary mb-2">Engineering control plane</div><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Good afternoon. What are we shipping?</h1><p className="mt-2 text-sm text-muted-foreground max-w-2xl">Coordinate projects, specialist agents and local AI from one operational workspace.</p></div>
            <div className="flex gap-2"><button className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary"><Icons.RefreshCw className="size-4" /></button><Link to="/console" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Start engineering task</Link></div>
          </div>
          <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <Metric label="Active runs" value="08" delta="+3 today" icon={Icons.Activity} /><Metric label="Agents ready" value="32" delta="12 working" icon={Icons.Bot} /><Metric label="Delivery health" value="97.4%" delta="+2.1% this week" icon={Icons.Gauge} /><Metric label="Model capacity" value="68%" delta="Local / Ollama" icon={Icons.Cpu} />
          </section>
          <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-4 mb-6">
            <section className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"><div className="flex items-center justify-between mb-5"><div><h2 className="font-semibold">Active engineering</h2><p className="text-xs text-muted-foreground mt-1">Live work across connected projects</p></div><Link to="/console" className="text-xs text-primary hover:underline">Open console →</Link></div><div className="space-y-3"><WorkRow title="Seller authentication hardening" project="bredabuy-ghana" progress={78} agents="Architect · Backend · QA" /><WorkRow title="Claims workflow refactor" project="whisppharma" progress={54} agents="Backend · Database" /><WorkRow title="AI runtime integration" project="ai-engineering-studio" progress={91} agents="DevOps · Review" /></div></section>
            <section className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-center justify-between mb-5"><div><h2 className="font-semibold">Runtime</h2><p className="text-xs text-muted-foreground mt-1">Local intelligence health</p></div><span className="size-2 rounded-full bg-emerald-400" /></div><div className="space-y-4"><Health label="Ollama" value="Connected" /><Health label="Context broker" value="Ready" /><Health label="Git sandbox" value="Protected" /><Health label="GitHub" value="Connected" /></div><div className="mt-5 pt-4 border-t border-border flex justify-between text-xs"><span className="text-muted-foreground">Default model</span><span className="font-mono">deepseek-coder</span></div></section>
          </div>
          <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-4">
            <section className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Agent activity</h2><p className="text-xs text-muted-foreground mt-1">Specialists currently operating</p></div><button className="text-muted-foreground"><Icons.MoreHorizontal className="size-4" /></button></div><div className="space-y-3">{AGENTS.slice(0,5).map((a,i)=><div key={a.id} className="flex items-center gap-3"><span className={`size-2 rounded-full ${i<3?"bg-primary animate-pulse":"bg-muted-foreground/40"}`} /><div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{a.name}</div><div className="text-[11px] text-muted-foreground truncate">{a.category} · {i<3?"working":"standby"}</div></div><span className="text-[10px] font-mono text-muted-foreground">{i<3?`${61+i*9}%`:"ready"}</span></div>)}</div></section>
            <section className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-center justify-between mb-4"><div><h2 className="font-semibold">Agent directory</h2><p className="text-xs text-muted-foreground mt-1">Search the specialist network</p></div><div className="relative"><Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search agents" className="w-40 sm:w-56 pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" /></div></div><div className="grid sm:grid-cols-2 gap-2">{filtered.map(a=><div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/60 transition"><span className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icons.Bot className="size-3.5" /></span><div className="min-w-0"><div className="text-xs font-medium truncate">{a.name}</div><div className="text-[10px] text-muted-foreground truncate">{a.category}</div></div></div>)}</div></section>
          </div>
        </main>
      </div>
    </div>
  );
}
function Metric({label,value,delta,icon:Icon}:{label:string;value:string;delta:string;icon:typeof Icons.Activity}) { return <div className="rounded-2xl border border-border bg-card/70 p-4"><div className="flex justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="size-4 text-primary" /></div><div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-emerald-400">{delta}</div></div> }
function WorkRow({title,project,progress,agents}:{title:string;project:string;progress:number;agents:string}) { return <div className="p-3 rounded-xl border border-border/70 hover:border-primary/30 transition"><div className="flex justify-between gap-3"><div className="min-w-0"><div className="text-sm font-medium truncate">{title}</div><div className="text-[11px] text-muted-foreground mt-1">{project} · {agents}</div></div><span className="text-xs font-mono text-muted-foreground">{progress}%</span></div><div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent" style={{width:`${progress}%`}} /></div></div> }
function Health({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400" />{value}</span></div> }
