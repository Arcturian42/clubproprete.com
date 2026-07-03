'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notifications/notify';
import { citySchema } from '@/features/onboarding/schemas';
import { t } from '@/i18n/fr';

const missionSchema = z.object({
  title: z.string().trim().min(5, 'Titre trop court.').max(160),
  description: z.string().trim().min(20, 'Description trop courte.').max(4000),
  city: citySchema.nullable(),
});

/** F-18 — créer une mission de sous-traitance (RLS : publish_mission). */
export async function createMission(
  _prev: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/espace/sous-traitance');
  await requireCapability('publish_mission');

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }
  const parsed = missionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t('error_validation') };

  const supabase = await createClient();
  const { error } = await supabase.from('missions').insert({
    creator_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    city_name: parsed.data.city?.cityName ?? null,
    insee_code: parsed.data.city?.inseeCode ?? null,
    region: parsed.data.city?.region ?? null,
    status: 'published',
  });
  if (error) return { error: t('error_forbidden') };

  await audit({ actorId: user.id, action: 'mission_published', targetType: 'mission' });
  revalidatePath('/espace/sous-traitance');
  return { success: 'Mission publiée.' };
}

/** F-18 — candidater à une mission (RLS : candidat + access_subcontracting). */
export async function applyToMission(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/sous-traitance');
  await requireCapability('access_subcontracting');
  const missionId = String(formData.get('missionId') ?? '');
  if (!z.string().uuid().safeParse(missionId).success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('mission_applications')
    .insert({ mission_id: missionId, applicant_user_id: user.id, status: 'submitted' });
  if (error) {
    revalidatePath('/espace/sous-traitance');
    return;
  }

  const { data: mission } = await supabase.from('missions').select('creator_id').eq('id', missionId).maybeSingle();
  if (mission) await notify({ userId: mission.creator_id, type: 'mission_application', payload: { mission_id: missionId } });
  await audit({ actorId: user.id, action: 'mission_application', targetType: 'mission', targetId: missionId });
  revalidatePath('/espace/sous-traitance');
}

/** F-18 — retrait de candidature (2C : candidat → withdrawn uniquement). */
export async function withdrawMissionApplication(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/sous-traitance');
  const id = String(formData.get('applicationId') ?? '');
  const supabase = await createClient();
  await supabase
    .from('mission_applications')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .eq('applicant_user_id', user.id);
  revalidatePath('/espace/sous-traitance');
}

/** F-18 — le créateur fait évoluer une candidature (2C : recruteur). */
export async function setMissionApplicationStatus(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/sous-traitance');
  const id = String(formData.get('applicationId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['viewed', 'interview', 'hired', 'rejected'].includes(status)) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from('mission_applications')
    .update({ status: status as 'viewed' | 'interview' | 'hired' | 'rejected' })
    .eq('id', id)
    .select('applicant_user_id')
    .maybeSingle();
  if (data) await notify({ userId: data.applicant_user_id, type: 'application_status', payload: { mission: true, status } });
  await audit({ actorId: user.id, action: `mission_application_${status}`, targetType: 'mission', targetId: id });
  revalidatePath('/espace/sous-traitance');
}
