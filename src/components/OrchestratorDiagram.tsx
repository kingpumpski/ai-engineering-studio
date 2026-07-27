import * as Icons from "lucide-react";

const RING = [
  { name: "Architect", icon: "Building2" }, { name: "Requirements", icon: "ClipboardList" },
  { name: "Product", icon: "Kanban" }, { name: "Design", icon: "Palette" },
  { name: "Frontend", icon: "Layout" }, { name: "Backend", icon: "Server" },
  { name: "Database", icon: "Database" }, { name: "DevOps", icon: "Cog" },
  { name: "Cloud", icon: "Cloud" }, { name: "Security", icon: "ShieldCheck" },
  { name: "QA", icon: "TestTube2" }, { name: "Debug", icon: "Bug" },
  { name: "Review", icon: "GitPullRequest" }, { name: "Docs", icon: "BookOpen" },
  { name: "Release", icon: "Rocket" }, { name: "SRE", icon: "AlertTriangle" },
];

export function OrchestratorDiagram() {
  const R = 160;
  return (
    <div className="relative aspect-square max-w-lg mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="-200 -200 400 400">
        {RING.map((_, i) => {
          const angle = (i / RING.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * R;
          const y = Math.sin(angle) * R;
          return (
            <line key={i} x1="0" y1="0" x2={x} y2={y}
              stroke="url(#grad)" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.5">
              <animate attributeName="stroke-dashoffset" from="0" to="12" dur="4s" repeatCount="indefinite" />
            </line>
          );
        })}
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.2 190)" />
            <stop offset="100%" stopColor="oklch(0.68 0.22 300)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="size-24 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center animate-pulse-glow shadow-2xl">
          <div className="text-center">
            <Icons.Crown className="size-8 text-background mx-auto" strokeWidth={2} />
            <div className="text-[10px] font-bold text-background mt-1">ORCHESTRATOR</div>
          </div>
        </div>
      </div>

      {RING.map((node, i) => {
        const angle = (i / RING.length) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * R;
        const y = Math.sin(rad) * R;
        const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[node.icon] ?? Icons.Sparkles;
        return (
          <div
            key={node.name}
            className="absolute left-1/2 top-1/2 group"
            style={{ transform: `translate(calc(-50% + ${x / 2}%), calc(-50% + ${y / 2}%))` }}
          >
            <div className="size-11 rounded-xl glass grid place-items-center hover:scale-125 hover:border-primary transition-all cursor-pointer">
              <Icon className="size-4 text-primary" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition text-[10px] whitespace-nowrap bg-background/90 px-2 py-0.5 rounded border border-border">
              {node.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
