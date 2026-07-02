import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getEntityForEdit } from '@/features/entities/queries';
import { EntityForm, type EntityFormInitial } from '@/features/entities/components/entity-form';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { ENTITY_TYPE_LABELS } from '@/referentiels/labels';
import type {
  ServiceType,
  ClientSegment,
  SupplierFamily,
  TrainingCertification,
} from '@/referentiels';

export const metadata: Metadata = { title: 'Modifier ma fiche' };

/** F-05 — édition d'une fiche (membre uniquement — RLS + garde requête). */
export default async function EditEntityPage({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;
  const user = await requireUser(`/espace/fiches/${entityId}`);
  const detail = await getEntityForEdit(entityId, user.id);
  if (!detail) notFound();

  const { entity, company, supplier, trainingOrg, independent, services } = detail;

  const initial: EntityFormInitial = {
    entityId: entity.id,
    type: entity.type,
    verified: entity.verified,
    publicUrl: `/${ENTITY_TYPE_SLUGS[entity.type]}/${entity.slug}`,
    city: entity.insee_code
      ? {
          cityName: entity.city_name ?? '',
          inseeCode: entity.insee_code,
          postalCode: entity.postal_code ?? '',
          department: entity.department ?? '',
          region: entity.region ?? '',
          lat: entity.lat ?? 0,
          lng: entity.lng ?? 0,
        }
      : null,
    name: company?.name ?? supplier?.name ?? trainingOrg?.name ?? '',
    legalName: company?.legal_name ?? '',
    siret: company?.siret ?? '',
    description: company?.description ?? supplier?.description ?? '',
    website: company?.website ?? supplier?.website ?? trainingOrg?.website ?? '',
    linkedin: company?.linkedin ?? '',
    googleMapsUrl: company?.google_maps_url ?? '',
    googleBusinessUrl: company?.google_business_url ?? '',
    address: company?.address ?? '',
    headcount: company?.headcount ?? '',
    foundedYear: company?.founded_year ? String(company.founded_year) : '',
    services: services as ServiceType[],
    segments: (company?.segments ?? []) as ClientSegment[],
    serviceAreas: company?.service_areas ?? independent?.service_areas ?? [],
    interventionRadius: company?.intervention_radius ? String(company.intervention_radius) : '',
    logoUrl: company?.logo_url ?? supplier?.logo_url ?? trainingOrg?.logo_url ?? null,
    family: (supplier?.family ?? '') as SupplierFamily | '',
    subCategory: supplier?.sub_category ?? '',
    certifications: (trainingOrg?.certifications ?? []) as TrainingCertification[],
    programsText: trainingOrg?.programs_text ?? '',
    headline: independent?.headline ?? '',
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/espace/fiches"
        className="mb-4 inline-flex items-center gap-1 text-caption text-grey hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Mes fiches
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-h2 font-bold text-navy">
          {initial.name || ENTITY_TYPE_LABELS[entity.type]}
        </h1>
        {entity.verified ? (
          <span className="inline-flex items-center gap-1 text-body font-medium text-teal">
            <BadgeCheck className="h-5 w-5" aria-hidden /> Vérifiée
          </span>
        ) : (
          <Link
            href={`/espace/fiches/${entity.id}/verification`}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-teal px-4 py-1.5 text-caption font-medium text-teal hover:bg-teal hover:text-white"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden /> Demander la vérification
          </Link>
        )}
      </div>
      <EntityForm initial={initial} />
    </div>
  );
}
