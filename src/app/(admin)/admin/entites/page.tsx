import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { ENTITY_TYPE_LABELS } from '@/referentiels/labels';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = { title: 'Entités — back-office' };

/** Entités (M15) — vue de pilotage (100 dernières ; RLS moderate voit tout). */
export default async function AdminEntitesPage() {
  await requireUser('/admin/entites');
  const supabase = await createClient();

  const { data: entities } = await supabase
    .from('entities')
    .select('id, slug, type, status, verified, city_name, source_consent, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h2 font-bold text-navy">Entités</h1>

      {!entities || entities.length === 0 ? (
        <EmptyState className="mt-6" title="Aucune entité." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-navy/10 bg-white shadow-lift">
          <table className="w-full text-left text-body">
            <thead className="border-b border-navy/10 bg-ice text-caption uppercase tracking-wide text-grey">
              <tr>
                <th className="px-4 py-3">Fiche</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Créée le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {entities.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${ENTITY_TYPE_SLUGS[e.type]}/${e.slug}`}
                      className="inline-flex items-center gap-1 font-medium text-navy hover:text-blue"
                    >
                      {e.slug} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    <p className="text-caption text-grey">{e.city_name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-caption text-grey">
                    {ENTITY_TYPE_LABELS[e.type]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      <Badge variant={e.status === 'active' ? 'default' : 'error'}>{e.status}</Badge>
                      {e.verified && <Badge variant="verified">vérifiée</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-caption text-grey">{e.source_consent}</td>
                  <td className="px-4 py-3 text-caption text-grey">
                    {new Date(e.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
