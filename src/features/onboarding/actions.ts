'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { slugWithSuffix } from '@/lib/slug';
import { t } from '@/i18n/fr';
import { onboardingSchema, type OnboardingInput, type Situation } from './schemas';
import type { EntityType } from '@/referentiels';

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Hiérarchie main_role — « situation la plus forte », jamais rétrogradée
 * (AC 01.3 : un re-passage du wizard ne baisse jamais main_role).
 */
const ROLE_RANK: Record<string, number> = {
  registered_user: 0,
  candidate: 1,
  independent: 2,
  training_org_owner: 3,
  supplier_owner: 4,
  company_owner: 5,
  verified_independent: 6,
  verified_training_org: 7,
  verified_supplier: 8,
  verified_company: 9,
  author: 10,
  admin: 98,
  super_admin: 99,
};

const SITUATION_ROLE: Record<Situation, string> = {
  candidate: 'candidate',
  independent: 'independent',
  training_org: 'training_org_owner',
  supplier: 'supplier_owner',
  company: 'company_owner',
};

const SITUATION_ENTITY: Partial<Record<Situation, EntityType>> = {
  company: 'company',
  supplier: 'supplier',
  training_org: 'training_org',
  independent: 'independent',
};

/** F-01 étape 5 — Récap : crée entité(s) + memberships, pose main_role, init profil. */
export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser('/espace/onboarding');

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: t('error_validation'), fieldErrors };
  }
  const input: OnboardingInput = parsed.data;
  const supabase = await createClient();

  // 1. Profil : identité + ville normalisée (jamais NULL — AC 01.2).
  const { data: profile } = await supabase
    .from('profiles')
    .select('main_role, current_entity_id, first_name, last_name')
    .eq('user_id', user.id)
    .single();
  if (!profile) return { error: t('error_generic') };

  // main_role le plus fort demandé par les situations cochées, sans rétrograder.
  const requestedRank = Math.max(
    ...input.situations.map((s) => ROLE_RANK[SITUATION_ROLE[s]] ?? 0),
  );
  const currentRank = ROLE_RANK[profile.main_role] ?? 0;
  const nextRole =
    requestedRank > currentRank
      ? (Object.entries(ROLE_RANK).find(([, r]) => r === requestedRank)?.[0] ??
        profile.main_role)
      : profile.main_role;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      city_name: input.city.cityName,
      insee_code: input.city.inseeCode,
      postal_code: input.city.postalCode,
      department: input.city.department,
      region: input.city.region,
      lat: input.city.lat,
      lng: input.city.lng,
      main_role: nextRole,
    })
    .eq('user_id', user.id);
  if (profileError) return { error: t('error_generic') };

  // 2. Entités : une par situation cochée (cumul supporté — AC 01.4).
  //    Idempotence de reprise (T8) : pas de doublon si l'utilisateur est déjà
  //    membre d'une entité du même type.
  const { data: memberships } = await supabase
    .from('entity_members')
    .select('entity_id, entities!inner(type)')
    .eq('user_id', user.id);
  const ownedTypes = new Set(
    (memberships ?? []).map((m) => (m.entities as unknown as { type: string }).type),
  );

  let firstEntityId: string | null = null;

  for (const situation of input.situations) {
    const entityType = SITUATION_ENTITY[situation];
    if (!entityType || ownedTypes.has(entityType)) continue;

    const name =
      situation === 'company'
        ? input.company!.name
        : situation === 'supplier'
          ? input.supplier!.name
          : situation === 'training_org'
            ? input.trainingOrg!.name
            : `${input.firstName} ${input.lastName}`;

    // 2a. Entité parente (RLS 1A : tout authentifié peut créer).
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({
        type: entityType,
        slug: slugWithSuffix(name),
        status: 'active',
        source_consent: 'self',
        city_name: input.city.cityName,
        insee_code: input.city.inseeCode,
        postal_code: input.city.postalCode,
        department: input.city.department,
        region: input.city.region,
        lat: input.city.lat,
        lng: input.city.lng,
      })
      .select('id')
      .single();
    if (entityError || !entity) return { error: t('error_generic') };

    // 2b. Auto-attribution owner (RLS 1B : premier membre d'une entité vierge).
    const { error: memberError } = await supabase.from('entity_members').insert({
      entity_id: entity.id,
      user_id: user.id,
      role: 'owner',
      invite_status: 'accepted',
    });
    if (memberError) return { error: t('error_generic') };

    // 2c. Table fille (déclenche la réindexation search_index — correction A).
    if (situation === 'company') {
      const { error } = await supabase.from('companies').insert({
        entity_id: entity.id,
        name: input.company!.name,
        siret: input.company!.siret ?? null,
      });
      if (error) return { error: t('error_generic') };
    } else if (situation === 'supplier') {
      const { error } = await supabase.from('suppliers').insert({
        entity_id: entity.id,
        name: input.supplier!.name,
        family: input.supplier!.family,
        sub_category: input.supplier!.subCategory,
      });
      if (error) return { error: t('error_generic') };
    } else if (situation === 'training_org') {
      const { error } = await supabase.from('training_orgs').insert({
        entity_id: entity.id,
        name: input.trainingOrg!.name,
      });
      if (error) return { error: t('error_generic') };
    } else if (situation === 'independent') {
      const { error } = await supabase.from('independents').insert({
        entity_id: entity.id,
        user_id: user.id,
        headline: input.independent?.headline ?? null,
      });
      if (error) return { error: t('error_generic') };
    }

    firstEntityId ??= entity.id;
  }

  // 3. Switcher : première entité créée si aucune sélection (T5).
  if (firstEntityId && !profile.current_entity_id) {
    await supabase
      .from('profiles')
      .update({ current_entity_id: firstEntityId })
      .eq('user_id', user.id);
  }

  await audit({
    actorId: user.id,
    action: 'onboarding_completed',
    targetType: 'user',
    targetId: user.id,
    reason: `situations: ${input.situations.join(',')}`,
  });

  revalidatePath('/espace', 'layout');
  redirect('/espace?bienvenue=1');
}
