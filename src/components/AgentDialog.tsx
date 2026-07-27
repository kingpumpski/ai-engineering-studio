import * as Icons from "lucide-react";
import type { Agent } from "@/lib/agents-data";
import { useEffect } from "react";

export function AgentDialog({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!agent) return null;
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[agent.icon] ?? Icons.Sparkles;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative glass rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 animate-scale-in shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 size-8 grid place-items-center rounded-lg hover:bg-secondary transition">
          <Icons.X className="size-4" />
        </button>
        <div className="flex items-start gap-4 mb-6">
          <div className="size-14 rounded-2xl grid place-items-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/30 animate-pulse-glow">
            <Icon className="size-7 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-mono text-muted-foreground">AGENT #{String(agent.id).padStart(2,"0")} · {agent.category}</p>
            <h2 className="text-2xl font-bold mt-1">{agent.name}</h2>
            <p className="text-muted-foreground mt-1">{agent.summary}</p>
          </div>
        </div>

        <Section title="Responsibilities" items={agent.responsibilities} />
        {agent.knowledge && <Section title="Expert Knowledge" items={agent.knowledge} tone="accent" />}
        {agent.supports && <Section title="Supports" items={agent.supports} tone="primary" />}

        <div className="mt-6 p-4 rounded-xl bg-secondary/40 border border-border">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Icons.Settings2 className="size-4 text-primary" /> Configuration
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enable this agent from the orchestrator config. Assign a preferred model (e.g. Claude Sonnet, GPT-5, Gemini Pro),
            set tool permissions, and attach the MCP servers it needs. Toggle human-in-the-loop for destructive actions.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "primary" | "accent" }) {
  const cls = tone === "primary"
    ? "bg-primary/10 text-primary border-primary/20"
    : tone === "accent"
    ? "bg-accent/10 text-accent border-accent/20"
    : "bg-secondary text-secondary-foreground border-border";
  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className={`text-xs px-2.5 py-1 rounded-md border ${cls}`}>{it}</span>
        ))}
      </div>
    </div>
  );
}
