import { cn } from '#lib/utils.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      {Icon && (
        <div className="p-4 rounded-full bg-muted mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title || 'Sin datos'}</h3>
      {description && <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">{description}</p>}
      {action && action}
    </div>
  );
}
