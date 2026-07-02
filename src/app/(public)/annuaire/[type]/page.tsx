import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, BadgeCheck, SearchIcon } from 'lucide-react';
import { searchDirectory } from '@/features/directory-search/queries';
import { directorySlugToType, ENTITY_TYPE_SLUGS, DIRECTORY_TYPE_SLUGS } from '@/config/routes';
import { SERVICE_TYPES, type EntityType } from '@/referentiels';
import { SERVICE_LABELS, ENTITY_TYPE_LABELS } from '@/referentiels/labels';
import { FR_REGIONS } from '@/config/regions';
import { EmptyState, ErrorStateStatic } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { t } from '@/i18n/fr';

/**
 * Annuaire /annuaire/{type} (F-08) — filtres service + géo + vérifié, texte
 * libre, pagination keyset « Voir plus », URL partageable (état = GET).
 * ItemList + BreadcrumbList schema.org ; noindex quand des filtres sont actifs
 * (Annexe C : canonical sur la liste nue).
 */

const TITLES: Record<EntityType, { h1: string; desc: string }> = {
  company: {
    h1: 'Sociétés de nettoyage',
    desc: 'Prestataires de propreté partout en France — filtrez par service, zone et vérification.',
  },
  supplier: {
    h1: 'Fournisseurs de la propreté',
    desc: 'Machines, produits, consommables, EPI et logiciels pour les pros du nettoyage.',
  },
  training_org: {
    h1: 'Centres de formation propreté',
    desc: 'Organismes de formation aux métiers de la propreté : CQP, CACES, SST, Qualiopi.',
  },
  independent: {
    h1: 'Indépendants de la propreté',
    desc: 'Auto-entrepreneurs et indépendants disponibles en renfort ou en sous-traitance.',
  },
};

interface SearchParams {
  q?: string;
  service?: string;
  region?: string;
  verifie?: string;
  cursor?: string;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { type: typeSlug } = await params;
  const sp = await searchParams;
  const type = directorySlugToType(typeSlug);
  if (!type) return { title: 'Annuaire' };
  const hasFilters = Boolean(sp.q || sp.service || sp.region || sp.verifie || sp.cursor);
  return {
    title: `${TITLES[type].h1} — annuaire`,
    description: TITLES[type].desc,
    alternates: { canonical: `/annuaire/${typeSlug}` },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function AnnuairePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { type: typeSlug } = await params;
  const sp = await searchParams;
  const type = directorySlugToType(typeSlug);
  if (!type) notFound();

  const { rows, nextCursor, error } = await searchDirectory({
    type,
    q: sp.q?.trim() || undefined,
    service: sp.service && (SERVICE_TYPES as readonly string[]).includes(sp.service) ? sp.service : undefined,
    region: sp.region && (FR_REGIONS as readonly string[]).includes(sp.region) ? sp.region : undefined,
    verifiedOnly: sp.verifie === '1',
    cursor: sp.cursor,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: process.env.NEXT_PUBLIC_SITE_URL },
          { '@type': 'ListItem', position: 2, name: TITLES[type].h1 },
        ],
      },
      {
        '@type': 'ItemList',
        numberOfItems: rows.length,
        itemListElement: rows.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.title,
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/${ENTITY_TYPE_SLUGS[type]}/${r.slug}`,
        })),
      },
    ],
  };

  const nextParams = new URLSearchParams();
  if (sp.q) nextParams.set('q', sp.q);
  if (sp.service) nextParams.set('service', sp.service);
  if (sp.region) nextParams.set('region', sp.region);
  if (sp.verifie) nextParams.set('verifie', sp.verifie);
  if (nextCursor) nextParams.set('cursor', nextCursor);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Onglets de type */}
      <nav aria-label="Types d'annuaire" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(DIRECTORY_TYPE_SLUGS) as EntityType[]).map((tKey) => (
          <Link
            key={tKey}
            href={`/annuaire/${DIRECTORY_TYPE_SLUGS[tKey]}`}
            aria-current={tKey === type ? 'page' : undefined}
            className={cn(
              'min-h-11 rounded-full border px-4 py-2 text-body font-medium transition-colors',
              tKey === type
                ? 'border-blue bg-blue text-white'
                : 'border-navy/15 bg-white text-navy hover:border-blue hover:text-blue',
            )}
          >
            {ENTITY_TYPE_LABELS[tKey]}
          </Link>
        ))}
      </nav>

      <h1 className="text-h1 font-bold text-navy">{TITLES[type].h1}</h1>
      <p className="mt-1 max-w-2xl text-body text-grey">{TITLES[type].desc}</p>

      {/* Filtres — formulaire GET : URL partageable (AC F-08) */}
      <form method="get" className="mt-6 grid gap-3 rounded-lg border border-navy/10 bg-ice p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <label htmlFor="dir-q" className="sr-only">
            Recherche
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey"
              aria-hidden
            />
            <input
              id="dir-q"
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="Ex. : nettoyage vitres, désinfection…"
              className="min-h-11 w-full rounded-sm border border-navy/15 bg-white py-2 pl-9 pr-3 text-body text-navy placeholder:text-grey/70"
            />
          </div>
        </div>

        {type === 'company' && (
          <div>
            <label htmlFor="dir-service" className="sr-only">
              Service
            </label>
            <select
              id="dir-service"
              name="service"
              defaultValue={sp.service ?? ''}
              className="min-h-11 w-full rounded-sm border border-navy/15 bg-white px-3 py-2 text-body text-navy"
            >
              <option value="">Tous les services</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="dir-region" className="sr-only">
            Région
          </label>
          <select
            id="dir-region"
            name="region"
            defaultValue={sp.region ?? ''}
            className="min-h-11 w-full rounded-sm border border-navy/15 bg-white px-3 py-2 text-body text-navy"
          >
            <option value="">Toute la France</option>
            {FR_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-body text-navy">
            <input
              type="checkbox"
              name="verifie"
              value="1"
              defaultChecked={sp.verifie === '1'}
              className="h-4 w-4 accent-[#0A66C2]"
            />
            Vérifiées
          </label>
          <button type="submit" className={cn(buttonVariants({ size: 'sm' }))}>
            Filtrer
          </button>
        </div>
      </form>

      {/* Résultats — 4 états UI */}
      <div className="mt-6">
        {error ? (
          <ErrorStateStatic message={t('error_generic')} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={t('empty_directory')}
            description="Essayez sans filtre, ou avec une autre région."
          />
        ) : (
          <>
            <p className="mb-3 text-caption text-grey" aria-live="polite">
              {rows.length}
              {nextCursor ? '+' : ''} résultat{rows.length > 1 ? 's' : ''}
              {sp.q ? ` · tri par pertinence` : ' · fiches vérifiées en tête'}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <li key={r.entity_id}>
                  <Link
                    href={`/${ENTITY_TYPE_SLUGS[type]}/${r.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-navy/10 bg-white p-4 shadow-lift transition-shadow hover:shadow-lift-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-h4 font-semibold text-navy group-hover:text-blue">
                        {r.title ?? r.slug}
                      </h2>
                      {r.verified && (
                        <Badge variant="verified" className="shrink-0">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Vérifiée
                        </Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="mt-2 line-clamp-2 text-caption text-grey">{r.description}</p>
                    )}
                    <p className="mt-auto flex items-center gap-1 pt-3 text-caption text-grey">
                      {r.city_name && (
                        <>
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {r.city_name}
                          {r.department ? ` (${r.department})` : ''}
                        </>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            {nextCursor && (
              <div className="mt-8 text-center">
                <Link
                  href={`/annuaire/${typeSlug}?${nextParams.toString()}`}
                  className={cn(buttonVariants({ variant: 'secondary' }))}
                  rel="nofollow"
                >
                  Voir plus de résultats
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
