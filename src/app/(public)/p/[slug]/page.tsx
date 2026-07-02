import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, BadgeCheck, UserPlus, MessageSquare } from 'lucide-react';
import { getPublicProfileBySlug } from '@/features/profiles/queries';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Profil public /p/{slug} (F-04, PRD 8) — Person + ProfilePage schema.org.
 * ISR 5 min ; 404 si slug inconnu/privé/supprimé (RLS). Les CTA connexion /
 * message seront actifs avec le graphe social (MVP 3) : liens vers /signup.
 */
export const revalidate = 300;

const TYPE_LABEL: Record<string, string> = {
  company: 'Société',
  supplier: 'Fournisseur',
  training_org: 'Centre de formation',
  independent: 'Indépendant',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicProfileBySlug(slug);
  if (!data) return { title: 'Profil introuvable' };
  const name = `${data.profile.first_name ?? ''} ${data.profile.last_name ?? ''}`.trim();
  return {
    title: `${name}${data.profile.headline ? ` — ${data.profile.headline}` : ''}`,
    description: data.profile.bio?.slice(0, 160) ?? `Profil de ${name} sur ClubProprete.`,
    alternates: { canonical: `/p/${slug}` },
  };
}

export default async function ProfilePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicProfileBySlug(slug);
  if (!data) notFound();

  const { profile, skills, entities } = data;
  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Membre';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      description: profile.headline ?? undefined,
      address: profile.city_name
        ? { '@type': 'PostalAddress', addressLocality: profile.city_name, addressRegion: profile.region ?? undefined }
        : undefined,
    },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* En-tête */}
      <header className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar src={profile.photo_url} name={name} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-h2 font-bold text-navy">{name}</h1>
            {profile.headline && <p className="mt-0.5 text-body text-grey">{profile.headline}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-grey">
              {profile.city_name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {profile.city_name}
                  {profile.department ? ` (${profile.department})` : ''}
                </span>
              )}
              {entities.some((e) => e.verified) && (
                <span className="inline-flex items-center gap-1 font-medium text-teal">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Entité vérifiée
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
              <UserPlus className="h-4 w-4" aria-hidden /> Se connecter
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
              <MessageSquare className="h-4 w-4" aria-hidden /> Message
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {/* À propos */}
          <section aria-labelledby="apropos">
            <h2 id="apropos" className="mb-2 text-h4 font-semibold text-navy">
              À propos
            </h2>
            {profile.bio ? (
              <p className="whitespace-pre-line text-body leading-relaxed text-navy">{profile.bio}</p>
            ) : (
              <EmptyState title="Cette section est vide pour le moment." />
            )}
          </section>

          {/* Publications (MVP 2) */}
          <section aria-labelledby="publications">
            <h2 id="publications" className="mb-2 text-h4 font-semibold text-navy">
              Publications
            </h2>
            <EmptyState
              title="Aucun article publié."
              description="Les articles du média communautaire s'afficheront ici (MVP 2)."
            />
          </section>

          {/* Recommandations (MVP 3) */}
          <section aria-labelledby="recos">
            <h2 id="recos" className="mb-2 text-h4 font-semibold text-navy">
              Recommandations
            </h2>
            <EmptyState
              title="Pas encore de recommandation."
              description="Les recommandations entre professionnels arrivent avec le réseau (MVP 3)."
            />
          </section>
        </div>

        <aside className="space-y-6">
          {/* Compétences */}
          <section aria-labelledby="skills">
            <h2 id="skills" className="mb-2 text-h4 font-semibold text-navy">
              Compétences
            </h2>
            {skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <li key={s.id}>
                    <Badge>{s.label}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-grey">Aucune compétence renseignée.</p>
            )}
          </section>

          {/* Entités liées */}
          <section aria-labelledby="entites">
            <h2 id="entites" className="mb-2 text-h4 font-semibold text-navy">
              Entités
            </h2>
            {entities.length > 0 ? (
              <ul className="space-y-2">
                {entities.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/${ENTITY_TYPE_SLUGS[e.type]}/${e.slug}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-navy/10 bg-white p-3 text-body text-navy hover:border-blue"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{e.slug}</span>
                        <span className="text-caption text-grey">
                          {TYPE_LABEL[e.type]}
                          {e.city_name ? ` · ${e.city_name}` : ''}
                        </span>
                      </span>
                      {e.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal" aria-hidden />}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-grey">Aucune entité liée.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
