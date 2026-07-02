import { EmptyState } from '@/components/states';

/** Écran d'espace membre pour un module d'un MVP ultérieur. */
export function EspaceModuleStub({
  title,
  description,
  mvp,
}: {
  title: string;
  description: string;
  mvp: 'MVP 2' | 'MVP 3' | 'MVP 4';
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">{title}</h1>
      <p className="mt-1 text-body text-grey">{description}</p>
      <EmptyState className="mt-6" title={`Disponible avec le ${mvp}.`} />
    </div>
  );
}
