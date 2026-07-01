import { cn } from '@/lib/utils';

/**
 * Les 4 états UI obligatoires sur chaque écran de données (§8, CLAUDE.md) :
 * Vide · Chargement · Erreur · Succès. Layout stable, jamais d'échec silencieux.
 */

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-grey/30 bg-bg-light p-8 text-center',
        className,
      )}
    >
      <p className="text-body font-medium text-navy">{title}</p>
      {description && <p className="max-w-md text-caption text-grey">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-md border border-error/30 bg-white p-6 text-center',
        className,
      )}
    >
      <p className="text-body text-error">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-sm border border-grey/30 px-3 py-2 text-caption font-medium text-navy hover:bg-bg-light"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/** Skeleton : layout stable pendant le chargement (pas de saut de mise en page). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-bg-light', className)} aria-hidden />;
}
