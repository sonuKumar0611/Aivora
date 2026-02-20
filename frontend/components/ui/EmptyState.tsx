import { clsx } from 'clsx';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-6 text-center animate-in',
        className
      )}
    >
      <div className="rounded-2xl bg-brand-border/80 p-6 mb-6 text-brand-textMuted">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-brand-textHeading mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-brand-textMuted max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
