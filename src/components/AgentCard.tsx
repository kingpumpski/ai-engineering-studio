import * as Icons from "lucide-react";
import type { Agent } from "@/lib/agents-data";

export function AgentCard({ agent, onOpen }: { agent: Agent; onOpen: (a: Agent) => void }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[agent.icon] ?? Icons.Sparkles;
  return (
    <button
      onClick={() => onOpen(agent)}
      className="agent-card glass text-left rounded-2xl p-5 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="agent-icon size-11 rounded-xl grid place-items-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
          <Icon className="size-5 text-primary" strokeWidth={1.75} />
        </div>
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
          #{String(agent.id).padStart(2, "0")}
        </span>
      </div>
      <div>
        <h3 className="text-base font-semibold leading-tight">{agent.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
      </div>
      <p className="text-sm text-muted-foreground/90 line-clamp-2">{agent.summary}</p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-primary/80">
          {agent.category}
        </span>
        <Icons.ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}
