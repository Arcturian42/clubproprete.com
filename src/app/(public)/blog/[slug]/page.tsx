import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticleBySlug } from '@/features/articles/queries';
import { sanitizeStoredHtml } from '@/lib/sanitize/html';
import { Avatar } from '@/components/ui/avatar';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) return { title: 'Article introuvable' };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      images: article.featured_image ? [article.featured_image] : undefined,
      type: 'article',
    },
  };
}

/** Article publié (M08) — Article + Person schema.org, HTML re-sanitizé au rendu. */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const author = `${article.author?.first_name ?? ''} ${article.author?.last_name ?? ''}`.trim();
  const safeHtml = sanitizeStoredHtml(article.content ?? '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    datePublished: article.published_at ?? undefined,
    image: article.featured_image ?? undefined,
    author: { '@type': 'Person', name: author || 'Auteur' },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-caption text-blue underline">
        ← Tous les articles
      </Link>

      <h1 className="mt-4 text-h1 font-bold text-navy">{article.title}</h1>

      <div className="mt-4 flex items-center gap-3">
        <Avatar src={article.author?.photo_url} name={author || 'Auteur'} size={40} />
        <div>
          <Link href={`/p/${article.author?.slug}`} className="text-body font-medium text-navy hover:text-blue">
            {author || 'Auteur'}
          </Link>
          {article.published_at && (
            <p className="text-caption text-grey">
              {new Date(article.published_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {article.featured_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.featured_image} alt="" className="mt-6 w-full rounded-lg object-cover" />
      )}

      <div
        className="prose-article mt-8 space-y-4 text-body leading-relaxed text-navy [&_a]:text-blue [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-blue [&_blockquote]:pl-4 [&_blockquote]:text-grey [&_h2]:text-h3 [&_h2]:font-semibold [&_h3]:text-h4 [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </main>
  );
}
