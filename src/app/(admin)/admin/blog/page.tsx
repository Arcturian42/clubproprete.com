import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { decideArticle } from '@/features/articles/actions';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n/fr';

export const metadata: Metadata = { title: 'Blog — modération' };

/** F-13 — file de relecture des articles (pending). Capacité moderate. */
export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  await requireUser('/admin/blog');
  const { done, error } = await searchParams;
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, excerpt, featured_image, created_at, author:profiles!articles_author_id_fkey(slug, first_name, last_name)')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Relecture des articles</h1>
      <p className="mt-1 text-body text-grey">Articles soumis, en attente de publication.</p>

      {done && <Alert variant="success" className="mt-4">{t('success_decision_saved')}</Alert>}
      {error === 'reason' && (
        <Alert variant="error" className="mt-4">Un motif est obligatoire pour refuser.</Alert>
      )}
      {error === 'concurrent' && (
        <Alert variant="error" className="mt-4">Article déjà traité — liste rafraîchie.</Alert>
      )}

      <div className="mt-6 space-y-4">
        {!articles || articles.length === 0 ? (
          <EmptyState title="Aucun article en attente de relecture." />
        ) : (
          articles.map((a) => {
            const author = a.author as unknown as { slug: string; first_name: string | null; last_name: string | null };
            return (
              <Card key={a.id}>
                <h2 className="text-h4 font-semibold text-navy">{a.title}</h2>
                <p className="mt-1 text-caption text-grey">
                  par{' '}
                  <Link href={`/p/${author?.slug}`} className="text-blue underline">
                    {`${author?.first_name ?? ''} ${author?.last_name ?? ''}`.trim() || author?.slug}
                  </Link>{' '}
                  · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </p>
                {a.excerpt && <p className="mt-2 text-body text-grey">{a.excerpt}</p>}
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4">
                  <form action={decideArticle}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="decision" value="published" />
                    <Button type="submit" size="sm">Publier</Button>
                  </form>
                  <form action={decideArticle} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <div>
                      <label htmlFor={`reason-${a.id}`} className="mb-1 block text-caption text-grey">
                        Motif de refus (obligatoire)
                      </label>
                      <input
                        id={`reason-${a.id}`}
                        name="reason"
                        required
                        minLength={3}
                        className="min-h-11 w-64 rounded-sm border border-navy/15 px-3 py-2 text-body"
                        placeholder="Ex. : hors sujet, sources manquantes"
                      />
                    </div>
                    <Button type="submit" variant="destructive" size="sm">Refuser</Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
