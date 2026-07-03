import type { Metadata } from 'next';
import { FileDown } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public';
import { ResourceDownloadForm } from '@/features/resources/components/download-form';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = {
  title: 'Ressources — modèles et checklists gratuits',
  description:
    'Modèles de documents, checklists et guides pratiques pour les professionnels de la propreté.',
  alternates: { canonical: '/ressources' },
};

export const revalidate = 600;

/** M09 — ressources téléchargeables (gating email). */
export default async function RessourcesPage() {
  const supabase = createPublicClient();
  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, description, kind, cover_image')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-h1 font-bold text-navy">Ressources gratuites</h1>
      <p className="mt-1 max-w-2xl text-body text-grey">
        Modèles de contrats, checklists qualité, grilles tarifaires — contre un simple email.
      </p>

      {!resources || resources.length === 0 ? (
        <EmptyState className="mt-8" title="Aucune ressource publiée pour le moment." />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {resources.map((r) => (
            <article key={r.id} className="rounded-lg border border-navy/10 bg-white p-5 shadow-lift">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ice text-blue">
                  <FileDown className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-h4 font-semibold text-navy">{r.title}</h2>
                  {r.description && <p className="mt-1 text-caption text-grey">{r.description}</p>}
                </div>
              </div>
              <div className="mt-4 border-t border-navy/10 pt-4">
                <ResourceDownloadForm resourceId={r.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
