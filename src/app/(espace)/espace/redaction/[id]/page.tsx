import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getArticleForEdit } from '@/features/articles/queries';
import { submitArticle, deleteArticleDraft } from '@/features/articles/actions';
import { ArticleEditor } from '@/features/articles/components/article-editor';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Modifier un article' };

// Le contenu stocké est du HTML sanitizé ; l'éditeur ré-édite en texte.
// On repart du HTML tel quel (l'auteur peut retoucher en Markdown/texte simple).
export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const user = await requireUser(`/espace/redaction/${id}`);
  const article = await getArticleForEdit(id, user.id);
  if (!article) notFound();

  const supabase = await createClient();
  const { data: categories } = await supabase.from('article_categories').select('id, label').order('label');

  const editable = article.status === 'draft' || article.status === 'rejected';

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/espace/redaction"
        className="mb-4 inline-flex items-center gap-1 text-caption text-grey hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Espace rédaction
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-h2 font-bold text-navy">{article.title}</h1>
        {article.status === 'rejected' && <Badge variant="error">À corriger</Badge>}
        {article.status === 'pending' && <Badge variant="pending">En relecture</Badge>}
        {article.status === 'published' && <Badge variant="verified">Publié</Badge>}
      </div>

      {saved && <Alert variant="success" className="mb-4">Brouillon enregistré.</Alert>}
      {error === 'image' && (
        <Alert variant="error" className="mb-4">
          Ajoutez une image à la une avant de soumettre l&apos;article.
        </Alert>
      )}

      {editable ? (
        <>
          <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
            <ArticleEditor
              initial={{
                id: article.id,
                title: article.title,
                contentMarkdown: article.content ?? '',
                categoryId: article.category_id ?? '',
                featuredImage: article.featured_image ?? '',
              }}
              categories={categories ?? []}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <form action={deleteArticleDraft}>
              <input type="hidden" name="id" value={article.id} />
              <Button type="submit" variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" aria-hidden /> Supprimer
              </Button>
            </form>
            <form action={submitArticle}>
              <input type="hidden" name="id" value={article.id} />
              <Button type="submit">
                <Send className="h-4 w-4" aria-hidden /> Soumettre à relecture
              </Button>
            </form>
          </div>
        </>
      ) : (
        <Alert variant="info">
          Cet article est {article.status === 'pending' ? 'en attente de relecture' : 'publié'} et
          n&apos;est pas modifiable directement. Pour le corriger, créez une révision.
        </Alert>
      )}
    </div>
  );
}
