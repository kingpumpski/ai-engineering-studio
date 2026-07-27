import * as Icons from "lucide-react";
import { useState } from "react";
import { EDITOR_SETUPS, MCP_SERVERS, API_KEYS } from "@/lib/mcp-setup";

export function MCPSetup() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const setup = EDITOR_SETUPS[active];
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[setup.icon] ?? Icons.Code2;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {EDITOR_SETUPS.map((s, i) => {
          const SIcon = (Icons as unknown as Record<string, Icons.LucideIcon>)[s.icon] ?? Icons.Code2;
          return (
            <button
              key={s.editor}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap lg:whitespace-normal transition-all border ${
                i === active
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "border-transparent hover:bg-secondary/60 text-muted-foreground"
              }`}
            >
              <SIcon className="size-4 shrink-0" />
              <span className="text-sm font-medium">{s.editor}</span>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center border border-primary/20">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{setup.editor}</h3>
              <p className="text-xs font-mono text-muted-foreground">{setup.configPath}</p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(setup.snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/70 border border-border flex items-center gap-2 transition"
          >
            {copied ? <Icons.Check className="size-3.5 text-primary" /> : <Icons.Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <pre className="bg-background/60 border border-border rounded-xl p-4 overflow-x-auto text-xs font-mono leading-relaxed">
          <code>{setup.snippet}</code>
        </pre>

        <ul className="space-y-1.5">
          {setup.notes.map((n) => (
            <li key={n} className="text-sm text-muted-foreground flex gap-2">
              <Icons.ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
              {n}
            </li>
          ))}
        </ul>

        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended MCP servers</h4>
            <div className="space-y-1.5">
              {MCP_SERVERS.map((s) => (
                <a key={s.name} href={s.link} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition group">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary">{s.pkg}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Model API keys</h4>
            <div className="space-y-1.5">
              {API_KEYS.map((k) => (
                <a key={k.env} href={k.get} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition group">
                  <span className="font-medium">{k.provider}</span>
                  <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary">{k.env}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
