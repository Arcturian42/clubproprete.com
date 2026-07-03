import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, BadgeCheck, Globe, ExternalLink, Building2 } from 'lucide-react';
import { getPublicEntityBySlug } from '@/features/entities/queries';
import { entitySlugToType } from '@/config/routes';
import {
  SERVICE_LABELS,
  SEGMENT_LABELS,
  FAMILY_LABELS,
  CERTIFICATION_LABELS,
  ENTITY_TYPE_LABELS,
  subCategoryLabel,
} from '@/referentiels/labels';
import type { ServiceType, ClientSegment, SupplierFamily, TrainingCertification } from '@/referentiels';
import { Badge } from '@/components/ui/badge';
import { ContactEntityButton } from '@/features/messaging/components/contact-entity-button';
import { ReportButton } from '@/features/moderation/components/report-button';

/**
 * Fiche entité publique /{type}/{slug} (F-05/F-08) — LocalBusiness schema.org,
 * ISR 5 min, 404 si type hors référentiel d'URL ou fiche inconnue (RLS filtre
 * active + non supprimée). Contact (F-24) : ouvre une conversation — CTA vers
 * /signup tant que la messagerie (MVP 3) n'est pas livrée.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}): Promise<Metadata> {
  const { type: typeSlug, slug } = await params;
  const type = entitySlugToType(typeSlug);
  if (!type) notFound();
  const detail = await getPublicEntityBySlug(type, slug);
  if (!detail) return { title: 'Fiche introuvable' };
  const name =
    detail.company?.name ?? detail.supplier?.name ?? detail.trainingOrg?.name ?? detail.independent?.headline ?? slug;
  const desc =
    detail.company?.description ?? detail.supplier?.description ?? detail.trainingOrg?.programs_text ?? '';
  return {
    title: `${name} — ${ENTITY_TYPE_LABELS[type]}${detail.entity.city_name ? ` à ${detail.entity.city_name}` : ''}`,
    description: desc.slice(0, 160) || `${name} sur ClubProprete, l'annuaire de la propreté.`,
    alternates: { canonical: `/${typeSlug}/${slug}` },
  };
}

export default async function EntityPublicPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type: typeSlug, slug } = await params;
  const type = entitySlugToType(typeSlug);
  if (!type) notFound();

  const detail = await getPublicEntityBySlug(type, slug);
  if (!detail) notFound();

  const { entity, company, supplier, trainingOrg, independent, services } = detail;
  const name =
    company?.name ?? supplier?.name ?? trainingOrg?.name ?? independent?.headline ?? 'Fiche';
  const description =
    company?.description ?? supplier?.description ?? trainingOrg?.programs_text ?? null;
  const website = company?.website ?? supplier?.website ?? trainingOrg?.website ?? null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type === 'company' ? 'LocalBusiness' : 'Organization',
    name,
    description: description?.slice(0, 300) ?? undefined,
    url: website ?? undefined,
    address: entity.city_name
      ? {
          '@type': 'PostalAddress',
          addressLocality: entity.city_name,
          postalCode: entity.postal_code ?? undefined,
          addressRegion: entity.region ?? undefined,
          addressCountry: 'FR',
        }
      : undefined,
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
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-ice text-blue">
            <Building2 className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h2 font-bold text-navy">{name}</h1>
              {entity.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2.5 py-0.5 text-caption font-medium text-white">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Vérifiée
                </span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-grey">
              <span>{ENTITY_TYPE_LABELS[type]}</span>
              {entity.city_name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {entity.city_name}
                  {entity.department ? ` (${entity.department})` : ''}
                </span>
              )}
              {supplier && supplier.family && (
                <span>
                  {FAMILY_LABELS[supplier.family as SupplierFamily] ?? supplier.family} ·{' '}
                  {subCategoryLabel(supplier.sub_category)}
                </span>
              )}
            </p>
          </div>
          <ContactEntityButton entityId={entity.id} />
        </div>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {description && (
            <section aria-labelledby="fiche-desc">
              <h2 id="fiche-desc" className="mb-2 text-h4 font-semibold text-navy">
                {type === 'training_org' ? 'Formations proposées' : 'À propos'}
              </h2>
              <p className="whitespace-pre-line text-body leading-relaxed text-navy">{description}</p>
            </section>
          )}

          {services.length > 0 && (
            <section aria-labelledby="fiche-services">
              <h2 id="fiche-services" className="mb-2 text-h4 font-semibold text-navy">
                Services
              </h2>
              <ul className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <li key={s}>
                    <Badge>{SERVICE_LABELS[s as ServiceType] ?? s}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {company?.segments && company.segments.length > 0 && (
            <section aria-labelledby="fiche-segments">
              <h2 id="fiche-segments" className="mb-2 text-h4 font-semibold text-navy">
                Segments clients
              </h2>
              <ul className="flex flex-wrap gap-2">
                {company.segments.map((s) => (
                  <li key={s}>
                    <Badge variant="outline">{SEGMENT_LABELS[s as ClientSegment] ?? s}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {trainingOrg?.certifications && trainingOrg.certifications.length > 0 && (
            <section aria-labelledby="fiche-certs">
              <h2 id="fiche-certs" className="mb-2 text-h4 font-semibold text-navy">
                Certifications
              </h2>
              <ul className="flex flex-wrap gap-2">
                {trainingOrg.certifications.map((c) => (
                  <li key={c}>
                    <Badge variant="verified">
                      {CERTIFICATION_LABELS[c as TrainingCertification] ?? c}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-navy/10 bg-white p-4">
            <h2 className="text-caption font-semibold uppercase tracking-wide text-grey">
              Informations
            </h2>
            <ul className="mt-2 space-y-2 text-body">
              {website && (
                <li>
                  <a
                    href={website}
                    rel="nofollow noopener"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-blue underline"
                  >
                    <Globe className="h-4 w-4" aria-hidden /> Site web
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              )}
              {company?.google_maps_url && (
                <li>
                  <a
                    href={company.google_maps_url}
                    rel="nofollow noopener"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-blue underline"
                  >
                    <MapPin className="h-4 w-4" aria-hidden /> Google Maps
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              )}
              {company?.service_areas && company.service_areas.length > 0 && (
                <li className="text-caption text-grey">
                  Zones : {company.service_areas.join(', ')}
                </li>
              )}
              {independent?.service_areas && independent.service_areas.length > 0 && (
                <li className="text-caption text-grey">
                  Zones : {independent.service_areas.join(', ')}
                </li>
              )}
            </ul>
          </div>

          {/* F-25 : lien de retrait sur les fiches non revendiquées (LCEN/RGPD) */}
          {entity.source_consent === 'seed_unconsented' && (
            <p className="text-caption text-grey">
              Cette fiche a été créée à partir de données publiques.{' '}
              <Link href="/contact" className="text-blue underline">
                Demander le retrait ou la revendication
              </Link>
              .
            </p>
          )}
          <div className="pt-2">
            <ReportButton targetType="entity" targetId={entity.id} />
          </div>
        </aside>
      </div>
    </main>
  );
}
