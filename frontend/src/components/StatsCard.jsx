import { cn } from '#lib/utils.js';

export function StatsCard({ title, value, icon: Icon, trend, className }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value ?? '—'}</p>
          {trend != null && (
            <p className={cn('text-xs', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-primary/5 text-primary">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
