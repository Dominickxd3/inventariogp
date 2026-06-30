import { cn } from '#lib/utils.js';

export function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-muted-foreground/10 rounded animate-pulse flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3 flex gap-4 border-t border-border">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-muted-foreground/10 rounded animate-pulse flex-1"
                style={{ opacity: 1 - (c * 0.1) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
