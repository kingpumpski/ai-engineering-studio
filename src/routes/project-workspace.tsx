import { createFileRoute, Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/project-workspace")({
  head: () => ({ meta: [{ title: "Project Workspace — Work" }, { name: "description", content: "Plan, orchestrate and ship engineering work from one AI workspace." }] }),
  component: ProjectWorkspace,
});

const tabs = ["Overview", "AI Tasks", "Agents", "Repository", "Architecture", "Memory", "CI/CD", "Pull Requests", "Audit"];

function ProjectWorkspace() {
  const [tab, setTab] = useState("Overview");
  const [task, setTask] = useState("");
  const [planMode, setPlanMode] = useState(true);
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0"><Link to="/dashboard" className="size-8 rounded-lg bg-secondary grid place-items-center hover:bg-secondary/80"><Icons.ArrowLeft className="size-4" /></Link><div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center"><Icons.Layers3 className="size-4 text-background" /></div><div className="min-w-0"><div className="font-semibold truncate">BredaBuy Ghana</div><div className="text-[10px] font-mono text-muted-foreground">kingpumpski / bredabuy-ghana · ai-upgrade-development</div></div></div>
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono"><span className="size-1.5 rounded-full bg-emerald-400" /> HEALTHY <span className="text-muted-foreground">•</span> OLLAMA READY</div>
        <button className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-secondary"><Icons.MoreHorizontal className="size-4" /></button>
      </div>
    </header>
    <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border/60 mb-6">{tabs.map(t => <button key={t} onClick={()=>setTab(t)} className={`shrink-0 px-3 py-2 rounded-lg text-xs transition ${tab===t?"bg-primary/10 text-primary font-medium":"text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>{t}</button>)}</div>
      <div className="grid xl:grid-cols-[1.35fr_.65fr] gap-5">
        <main>
          <div className="mb-6"><div className="text-[10px] font-mono uppercase tracking-[.2em] text-primary mb-2">{tab} / engineering workspace</div><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Build with your AI engineering team.</h1><p className="mt-2 text-sm text-muted-foreground max-w-2xl">Describe the outcome. Work assembles context, selects specialists and prepares a governed execution plan.</p></div>
          <section className="rounded-2xl border border-primary/20 bg-card/80 shadow-lg shadow-primary/5 overflow-hidden">
            <div className="p-5 sm:p-6"><div className="flex items-center justify-between mb-4"><div><div className="font-semibold">AI Task Composer</div><div className="text-xs text-muted-foreground mt-1">Local-first orchestration · human approval before writes</div></div><span className="px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-mono">READY</span></div>
              <textarea value={task} onChange={e=>setTask(e.target.value)} rows={5} placeholder="e.g. Fix seller authentication, add secure password recovery, update tests and prepare a draft PR." className="w-full resize-none rounded-xl border border-border bg-background/70 p-4 text-sm leading-6 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="mt-3 flex flex-wrap gap-2"><Chip icon={Icons.GitBranch} text="Repository context" /><Chip icon={Icons.BrainCircuit} text="Project memory" /><Chip icon={Icons.GitPullRequest} text="GitHub + CI" /><Chip icon={Icons.ShieldCheck} text="Approval gate" /></div>
            </div>
            <div className="border-t border-border/70 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-2"><button onClick={()=>setPlanMode(!planMode)} className={`size-5 rounded border grid place-items-center ${planMode?"border-primary bg-primary text-primary-foreground":"border-border"}`}>{planMode&&<Icons.Check className="size-3"/>}</button><span className="text-xs">Review plan before execution</span></div><div className="flex gap-2"><button className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-secondary">Save draft</button><button disabled={!task.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 flex items-center gap-2">{planMode?<Icons.Sparkles className="size-3.5"/>:<Icons.Play className="size-3.5"/>}{planMode?"Build plan":"Start task"}<Icons.ArrowRight className="size-3.5"/></button></div></div>
          </section>
          <section className="mt-5 grid sm:grid-cols-3 gap-3"><Stat label="Open tasks" value="12" icon={Icons.ListTodo}/><Stat label="Agents active" value="07" icon={Icons.Bot}/><Stat label="CI health" value="97.4%" icon={Icons.Gauge}/></section>
          <section className="mt-5 rounded-2xl border border-border bg-card/70 p-5"><div className="flex justify-between mb-4"><div><h2 className="font-semibold">Delivery pipeline</h2><p className="text-xs text-muted-foreground mt-1">Current engineering lifecycle</p></div><span className="text-[10px] font-mono text-emerald-400">ON TRACK</span></div><div className="grid grid-cols-2 md:grid-cols-6 gap-2">{["Discover","Context","Plan","Build","Verify","Review"].map((x,i)=><div key={x} className={`p-3 rounded-xl border ${i<4?"border-primary/20 bg-primary/5":"border-border"}`}><div className={`size-6 rounded-full grid place-items-center mb-2 text-[10px] ${i<4?"bg-primary text-primary-foreground":"bg-secondary text-muted-foreground"}`}>{i<4?<Icons.Check className="size-3"/>:i+1}</div><div className="text-xs font-medium">{x}</div><div className="text-[10px] text-muted-foreground mt-1">{i<4?"complete":"queued"}</div></div>)}</div></section>
        </main>
        <aside className="space-y-4"><section className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex justify-between items-start mb-4"><div><h2 className="font-semibold">Project health</h2><p className="text-xs text-muted-foreground mt-1">Live engineering signals</p></div><span className="size-2 rounded-full bg-emerald-400"/></div><div className="space-y-3"><Health label="Repository" value="Indexed"/><Health label="Context broker" value="Ready"/><Health label="Ollama" value="Connected"/><Health label="CI / CD" value="Passing"/><Health label="GitHub" value="Connected"/></div></section>
        <section className="rounded-2xl border border-border bg-card/70 p-5"><h2 className="font-semibold">Recommended team</h2><p className="text-xs text-muted-foreground mt-1 mb-4">Suggested for this project</p><div className="space-y-2">{[["Architect","Architecture"],["Backend Engineer","Implementation"],["Database Engineer","Data layer"],["Security Engineer","Security"],["QA Engineer","Verification"]].map(([n,r])=><div key={n} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/60"><span className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icons.Bot className="size-3.5"/></span><div className="flex-1"><div className="text-xs font-medium">{n}</div><div className="text-[10px] text-muted-foreground">{r}</div></div><span className="size-1.5 rounded-full bg-emerald-400"/></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-card/70 p-5"><div className="flex items-center gap-2 mb-3"><Icons.ShieldCheck className="size-4 text-primary"/><h2 className="font-semibold text-sm">Governance</h2></div><p className="text-xs text-muted-foreground leading-5">Agents can analyze and prepare changes. Repository writes require an explicit approval gate.</p></section></aside>
      </div>
    </div>
  </div>;
}
function Chip({icon:Icon,text}:{icon:typeof Icons.GitBranch;text:string}){return <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-[10px] text-muted-foreground"><Icon className="size-3"/>{text}</span>}
function Stat({label,value,icon:Icon}:{label:string;value:string;icon:typeof Icons.Activity}){return <div className="rounded-xl border border-border bg-card/60 p-4 flex items-center gap-3"><span className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icon className="size-4"/></span><div><div className="text-lg font-semibold">{value}</div><div className="text-[10px] text-muted-foreground">{label}</div></div></div>}
function Health({label,value}:{label:string;value:string}){return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-400"/>{value}</span></div>}
