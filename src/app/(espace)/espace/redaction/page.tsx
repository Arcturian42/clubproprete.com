import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, FileText, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getMyArticles, type Article } from '@/features/articles/queries';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Espace rédaction' };

/** F-13 — espace rédaction : 3 piles (garde write_article via middleware). */
export default async function RedactionPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser('/espace/redaction');
  const { submitted } = await searchParams;
  const piles = await getMyArticles(user.id);

  const columns: { key: string; title: string; icon: typeof FileText; items: Article[]; hint: string }[] = [
    { key: 'draft', title: 'Brouillons', icon: FileText, items: piles.drafts, hint: 'À compléter ou corriger' },
    { key: 'pending', title: 'En attente', icon: Clock, items: piles.pending, hint: 'En relecture' },
    { key: 'published', title: 'Publiés', icon: CheckCircle2, items: piles.published, hint: 'Visibles sur votre profil' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-navy">Espace rédaction</h1>
          <p className="mt-1 text-body text-grey">Vos articles pour le média communautaire.</p>
        </div>
        <Link href="/espace/redaction/nouveau" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" aria-hidden /> Nouvel article
        </Link>
      </div>

      {submitted && (
        <Alert variant="success" className="mt-4">
          Article soumis. Il sera relu avant publication et vous serez notifié.
        </Alert>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key} aria-labelledby={`pile-${col.key}`}>
            <h2 id={`pile-${col.key}`} className="mb-2 flex items-center gap-2 text-h4 font-semibold text-navy">
              <col.icon className="h-4 w-4 text-blue" aria-hidden /> {col.title}
              <span className="text-caption font-normal text-grey">({col.items.length})</span>
            </h2>
            {col.items.length === 0 ? (
              <EmptyState title={col.hint} className="min-h-[120px]" />
            ) : (
              <ul className="space-y-2">
                {col.items.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.status === 'published' ? `/blog/${a.slug}` : `/espace/redaction/${a.id}`}
                      className="block rounded-md border border-navy/10 bg-white p-3 shadow-lift hover:border-blue"
                    >
                      <p className="flex items-center gap-1.5 text-body font-medium text-navy">
                        <span className="line-clamp-1">{a.title}</span>
                        {a.status === 'published' && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-grey" aria-hidden />}
                      </p>
                      {a.status === 'rejected' && <Badge variant="error" className="mt-1">À corriger</Badge>}
                      <p className="mt-1 text-caption text-grey">
                        {new Date(a.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
