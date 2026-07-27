import * as Icons from "lucide-react";
import { useMemo, useState } from "react";
import { AGENTS } from "@/lib/agents-data";

const MODELS = [
  { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5", best: "Reasoning, code" },
  { id: "gpt-5", label: "GPT-5", best: "General, tools" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", best: "Long context" },
  { id: "deepseek-v3", label: "DeepSeek V3", best: "Cost-efficient" },
  { id: "ollama-local", label: "Ollama (local)", best: "Private, offline" },
];

const RECOMMENDED: Record<string, string> = {
  Core: "claude-sonnet-4.5", Design: "gpt-5", Engineering: "claude-sonnet-4.5",
  Data: "gemini-2.5-pro", Ops: "gpt-5", Quality: "claude-sonnet-4.5",
  Specialty: "deepseek-v3", AI: "gpt-5", Support: "gemini-2.5-pro",
};

export function TeamBuilder() {
  const [selected, setSelected] = useState<Set<number>>(new Set([1, 2, 6, 7, 8, 13, 17, 19]));
  const [model, setModel] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);

  const toggle = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const chosen = useMemo(() => AGENTS.filter((a) => selected.has(a.id)), [selected]);

  const config = useMemo(() => ({
    name: "my-synthesis-org",
    version: "1.0.0",
    orchestrator: { model: "claude-sonnet-4.5", humanInLoop: true, memory: "persistent" },
    agents: chosen.map((a) => ({
      id: a.id,
      role: a.name,
      model: model[a.id] ?? RECOMMENDED[a.category] ?? "claude-sonnet-4.5",
      permissions: ["read", "write", "test"],
      mcp: ["filesystem", "github"],
    })),
  }), [chosen, model]);

  const json = JSON.stringify(config, null, 2);

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{selected.size}</span> of {AGENTS.length} agents selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set(AGENTS.map((a) => a.id)))}
              className="text-xs px-3 py-1.5 rounded-lg glass hover:border-primary/40">All</button>
            <button onClick={() => setSelected(new Set())}
              className="text-xs px-3 py-1.5 rounded-lg glass hover:border-primary/40">Clear</button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 max-h-[560px] overflow-y-auto pr-2 custom-scroll">
          {AGENTS.map((a) => {
            const on = selected.has(a.id);
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[a.icon] ?? Icons.Sparkles;
            return (
              <div key={a.id} className={`glass rounded-xl p-3 border transition-all ${on ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                <button onClick={() => toggle(a.id)} className="flex items-start gap-3 w-full text-left">
                  <div className={`size-9 rounded-lg grid place-items-center shrink-0 transition ${on ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{a.name}</p>
                      {on && <Icons.CheckCircle2 className="size-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{a.role} · {a.category}</p>
                  </div>
                </button>
                {on && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <select
                      value={model[a.id] ?? RECOMMENDED[a.category] ?? "claude-sonnet-4.5"}
                      onChange={(e) => setModel({ ...model, [a.id]: e.target.value })}
                      className="w-full text-xs bg-background/60 border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label} — {m.best}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 h-fit lg:sticky lg:top-20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Icons.FileJson className="size-4 text-primary" /> synthesis.config.json
          </h3>
          <button
            onClick={() => { navigator.clipboard.writeText(json); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 hover:opacity-90 transition"
          >
            {copied ? <Icons.Check className="size-3.5" /> : <Icons.Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="bg-background/60 border border-border rounded-xl p-3 text-[11px] font-mono leading-relaxed overflow-auto max-h-[520px]">
          <code>{json}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
          <Icons.Info className="size-3.5 text-primary shrink-0 mt-0.5" />
          Drop this into your orchestrator to bootstrap the team. Models can be overridden per-agent at runtime.
        </p>
      </div>
    </div>
  );
}
