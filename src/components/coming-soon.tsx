import { EmptyState } from '@/components/states';

/** Section « à venir » — module planifié dans un MVP ultérieur (docs/08). */
export function ComingSoon({
  title,
  description,
  mvp,
}: {
  title: string;
  description: string;
  mvp: 'MVP 2' | 'MVP 3' | 'MVP 4';
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">{title}</h1>
      <p className="mt-2 text-body text-grey">{description}</p>
      <EmptyState
        className="mt-8"
        title={`Ce module arrive avec le ${mvp}.`}
        description="La plateforme est construite bloc par bloc — annuaire d'abord, puis contenu, réseau et emploi."
      />
    </main>
  );
}
