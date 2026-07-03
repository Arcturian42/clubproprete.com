import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { CreateResourceForm } from '@/features/resources/components/create-resource-form';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = { title: 'Ressources — back-office' };

/** M09 — gestion des ressources (capacité admin_panel). */
export default async function AdminRessourcesPage() {
  await requireUser('/admin/ressources');
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, status, kind, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-h2 font-bold text-navy">Ressources</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle ressource</CardTitle>
        </CardHeader>
        <CreateResourceForm />
      </Card>

      <section>
        <h2 className="mb-2 text-h4 font-semibold text-navy">Ressources existantes</h2>
        {!resources || resources.length === 0 ? (
          <EmptyState title="Aucune ressource." />
        ) : (
          <ul className="divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 p-3">
                <span className="text-body text-navy">{r.title}</span>
                <Badge variant={r.status === 'published' ? 'verified' : 'pending'}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
