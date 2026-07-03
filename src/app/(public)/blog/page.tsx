import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArticles } from '@/features/articles/queries';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = {
  title: 'Blog — le média de la propreté',
  description:
    'Articles écrits par la communauté : réglementation, technique, gestion, emploi dans la propreté.',
  alternates: { canonical: '/blog' },
};

export const revalidate = 300;

/** Média communautaire (M08) — liste des articles publiés. */
export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-h1 font-bold text-navy">Le média de la propreté</h1>
      <p className="mt-1 max-w-2xl text-body text-grey">
        Réglementation, technique, gestion, emploi — écrit par les professionnels du secteur.
      </p>

      {articles.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Aucun article publié pour le moment."
          description="Les premiers articles de la communauté arrivent bientôt."
          action={
            <Link href="/devenir-redacteur" className="font-medium text-blue underline">
              Devenir rédacteur
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => {
            const author = `${a.author?.first_name ?? ''} ${a.author?.last_name ?? ''}`.trim();
            return (
              <article key={a.id} className="flex flex-col overflow-hidden rounded-lg border border-navy/10 bg-white shadow-lift">
                {a.featured_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.featured_image} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-h4 font-semibold text-navy">
                    <Link href={`/blog/${a.slug}`} className="hover:text-blue">
                      {a.title}
                    </Link>
                  </h2>
                  {a.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-caption text-grey">{a.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-2">
                    <Avatar src={a.author?.photo_url} name={author || 'Auteur'} size={28} />
                    <Link href={`/p/${a.author?.slug}`} className="text-caption text-navy hover:text-blue">
                      {author || 'Auteur'}
                    </Link>
                    {a.published_at && (
                      <span className="ml-auto text-caption text-grey">
                        {new Date(a.published_at).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
