import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { ArticleEditor } from '@/features/articles/components/article-editor';

export const metadata: Metadata = { title: 'Nouvel article' };

/** F-13 — création d'un article (garde write_article via middleware). */
export default async function NewArticlePage() {
  await requireUser('/espace/redaction/nouveau');
  const supabase = await createClient();
  const { data: categories } = await supabase.from('article_categories').select('id, label').order('label');

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/espace/redaction"
        className="mb-4 inline-flex items-center gap-1 text-caption text-grey hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Espace rédaction
      </Link>
      <h1 className="mb-6 text-h2 font-bold text-navy">Nouvel article</h1>
      <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        <ArticleEditor
          initial={{ title: '', contentMarkdown: '', categoryId: '', featuredImage: '' }}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
