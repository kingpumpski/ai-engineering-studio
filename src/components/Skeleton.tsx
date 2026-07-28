export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-secondary/40 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3" aria-hidden="true">
      <div className="flex items-start justify-between">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-3 w-8" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="size-4 rounded" />
      </div>
    </div>
  );
}

export function AgentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-border/60" aria-hidden="true">
      <Skeleton className="size-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-4 w-20 hidden md:block" />
      <Skeleton className="h-2 w-24 hidden md:block" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function SectionSkeleton({ height = 320, label }: { height?: number; label?: string }) {
  return (
    <div
      className="glass rounded-2xl relative overflow-hidden flex items-center justify-center"
      style={{ height, contentVisibility: "auto", containIntrinsicSize: `${height}px` }}
      role="status"
      aria-label={label ?? "Loading section"}
    >
      <div className="absolute inset-0 shimmer" />
      {label && <span className="relative text-xs font-mono text-muted-foreground">{label}</span>}
    </div>
  );
}
