'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { t } from '@/i18n/fr';
import { updateProfileSchema } from './schemas';

export type ProfileFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

/** F-04 — mise à jour du profil (RLS : own uniquement). */
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser('/espace/profil');

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }

  const parsed = updateProfileSchema.safeParse(raw);
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

  const { data: current } = await supabase
    .from('profiles')
    .select('slug')
    .eq('user_id', user.id)
    .single();
  if (!current) return { error: t('error_generic') };

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      phone: input.phone ?? null,
      visibility: input.visibility,
      ...(input.city
        ? {
            city_name: input.city.cityName,
            insee_code: input.city.inseeCode,
            postal_code: input.city.postalCode,
            department: input.city.department,
            region: input.city.region,
            lat: input.city.lat,
            lng: input.city.lng,
          }
        : {}),
    })
    .eq('user_id', user.id);
  if (error) return { error: t('error_generic') };

  // Compétences : remplacement complet (RLS pskills_write : own).
  const { error: delError } = await supabase
    .from('profile_skills')
    .delete()
    .eq('profile_id', user.id);
  if (!delError && input.skillIds.length > 0) {
    await supabase
      .from('profile_skills')
      .insert(input.skillIds.map((skill_id) => ({ profile_id: user.id, skill_id })));
  }

  await audit({ actorId: user.id, action: 'profile_updated', targetType: 'profile', targetId: user.id });

  revalidatePath('/espace/profil');
  revalidateTag(`profile:${current.slug}`);
  revalidatePath(`/p/${current.slug}`);
  return { success: t('success_profile_updated') };
}
