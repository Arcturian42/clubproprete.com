'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { t } from '@/i18n/fr';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { entityEditSchema } from './schemas';

export type EntityFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

/**
 * F-05 — sauvegarde d'une fiche (entité + table fille + services).
 * RLS : écriture réservée aux membres (companies_write & co) ; la mise à jour
 * de la table fille redéclenche la réindexation search_index (correction A).
 * Le profil n'est jamais touché (AC 05.1 : « profil intact »).
 */
export async function updateEntity(
  _prev: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const user = await requireUser('/espace/fiches');
  const entityId = String(formData.get('entityId') ?? '');
  if (!entityId) return { error: t('error_validation') };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }

  const parsed = entityEditSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: t('error_validation'), fieldErrors };
  }
  const input = parsed.data;
  const supabase = await createClient();

  // Vérification d'appartenance (défense en profondeur ; RLS reste l'autorité).
  const { data: entity } = await supabase
    .from('entities')
    .select('id, type, slug')
    .eq('id', entityId)
    .maybeSingle();
  if (!entity || entity.type !== input.type) return { error: t('error_forbidden') };

  // 1. Géo de l'entité parente (si ville modifiée).
  if (input.city) {
    const { error } = await supabase
      .from('entities')
      .update({
        city_name: input.city.cityName,
        insee_code: input.city.inseeCode,
        postal_code: input.city.postalCode,
        department: input.city.department,
        region: input.city.region,
        lat: input.city.lat,
        lng: input.city.lng,
      })
      .eq('id', entityId);
    if (error) return { error: t('error_forbidden') };
  }

  // 2. Table fille selon le type.
  if (input.type === 'company') {
    const { error } = await supabase
      .from('companies')
      .update({
        name: input.name,
        legal_name: input.legalName ?? null,
        siret: input.siret ?? null,
        description: input.description ?? null,
        website: input.website ?? null,
        linkedin: input.linkedin ?? null,
        google_maps_url: input.googleMapsUrl ?? null,
        google_business_url: input.googleBusinessUrl ?? null,
        address: input.address ?? null,
        headcount: input.headcount ?? null,
        founded_year: input.foundedYear ?? null,
        segments: input.segments,
        service_areas: input.serviceAreas,
        intervention_radius: input.interventionRadius ?? null,
      })
      .eq('entity_id', entityId);
    if (error) return { error: t('error_forbidden') };

    // 3. Services (référentiel G.1) : remplacement complet.
    const { error: delError } = await supabase
      .from('company_services')
      .delete()
      .eq('entity_id', entityId);
    if (delError) return { error: t('error_forbidden') };
    if (input.services.length > 0) {
      const { error: insError } = await supabase
        .from('company_services')
        .insert(input.services.map((service_type) => ({ entity_id: entityId, service_type })));
      if (insError) return { error: t('error_generic') };
    }
  } else if (input.type === 'supplier') {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: input.name,
        family: input.family,
        sub_category: input.subCategory,
        description: input.description ?? null,
        website: input.website ?? null,
      })
      .eq('entity_id', entityId);
    if (error) return { error: t('error_forbidden') };
  } else if (input.type === 'training_org') {
    const { error } = await supabase
      .from('training_orgs')
      .update({
        name: input.name,
        certifications: input.certifications,
        programs_text: input.programsText ?? null,
        website: input.website ?? null,
      })
      .eq('entity_id', entityId);
    if (error) return { error: t('error_forbidden') };
  } else {
    const { error } = await supabase
      .from('independents')
      .update({
        headline: input.headline ?? null,
        service_areas: input.serviceAreas,
      })
      .eq('entity_id', entityId);
    if (error) return { error: t('error_forbidden') };
  }

  await audit({
    actorId: user.id,
    action: 'entity_updated',
    targetType: 'entity',
    targetId: entityId,
  });

  revalidatePath(`/espace/fiches/${entityId}`);
  revalidatePath(`/${ENTITY_TYPE_SLUGS[entity.type]}/${entity.slug}`);
  return { success: t('success_entity_updated') };
}

/** T5 — persiste le switcher d'entité courante. */
export async function setCurrentEntity(entityId: string) {
  const user = await requireUser('/espace/fiches');
  const supabase = await createClient();
  await supabase.from('profiles').update({ current_entity_id: entityId }).eq('user_id', user.id);
  revalidatePath('/espace/fiches');
}
