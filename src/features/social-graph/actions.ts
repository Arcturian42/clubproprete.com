'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notifications/notify';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { t } from '@/i18n/fr';

/** F-09 — envoyer une demande de connexion (from + not blocked ; 50/j). */
export async function sendConnectionRequest(formData: FormData): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/espace/reseau');
  const toUserId = String(formData.get('toUserId') ?? '');
  if (!z.string().uuid().safeParse(toUserId).success || toUserId === user.id) {
    return { error: t('error_validation') };
  }
  try {
    await rateLimit('connections', user.id);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('connections')
    .insert({ from_user_id: user.id, to_user_id: toUserId, status: 'pending' });
  if (error) {
    // Unicité (from,to) : demande déjà existante.
    return { error: 'Une demande existe déjà avec ce professionnel.' };
  }
  await notify({ userId: toUserId, type: 'connection_request', payload: { from: user.id } });
  await audit({ actorId: user.id, action: 'connection_requested', targetType: 'profile', targetId: toUserId });
  revalidatePath('/espace/reseau');
  return { success: 'Demande envoyée.' };
}

/** F-09 — accepter (2B : SEUL le destinataire, RLS conn_update). */
export async function acceptConnection(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/reseau');
  const fromUserId = String(formData.get('fromUserId') ?? '');
  const supabase = await createClient();
  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', user.id);
  if (!error) {
    await notify({ userId: fromUserId, type: 'connection_accepted', payload: { by: user.id } });
    await audit({ actorId: user.id, action: 'connection_accepted', targetType: 'profile', targetId: fromUserId });
  }
  revalidatePath('/espace/reseau');
}

/** F-09 — retirer/refuser une connexion (concerné). */
export async function removeConnection(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/reseau');
  const otherId = String(formData.get('otherId') ?? '');
  const supabase = await createClient();
  await supabase
    .from('connections')
    .delete()
    .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${user.id})`);
  revalidatePath('/espace/reseau');
}

/** F-09 — suivre / ne plus suivre (from + not blocked). */
export async function toggleFollow(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/reseau');
  const toUserId = String(formData.get('toUserId') ?? '');
  const following = formData.get('following') === '1';
  if (toUserId === user.id) return;
  const supabase = await createClient();
  if (following) {
    await supabase.from('follows').delete().eq('from_user_id', user.id).eq('to_user_id', toUserId);
  } else {
    const { error } = await supabase.from('follows').insert({ from_user_id: user.id, to_user_id: toUserId });
    if (!error) await notify({ userId: toUserId, type: 'new_follower', payload: { from: user.id } });
  }
  revalidatePath('/espace/reseau');
  revalidatePath('/p');
}

const recommendationSchema = z.object({
  toUserId: z.string().uuid(),
  quality: z.string().trim().max(60).optional(),
  text: z.string().trim().min(10, 'Quelques mots (10 caractères min).').max(600),
});

/** F-09 — recommander un professionnel (from + not blocked). */
export async function sendRecommendation(
  _prev: { error?: string; success?: string },
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/espace/reseau');
  const parsed = recommendationSchema.safeParse({
    toUserId: formData.get('toUserId'),
    quality: formData.get('quality') || undefined,
    text: formData.get('text'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t('error_validation') };
  if (parsed.data.toUserId === user.id) return { error: 'Vous ne pouvez pas vous recommander.' };

  const supabase = await createClient();
  const { error } = await supabase.from('recommendations').insert({
    from_user_id: user.id,
    to_user_id: parsed.data.toUserId,
    quality: parsed.data.quality ?? null,
    text: parsed.data.text,
  });
  if (error) return { error: t('error_generic') };
  await notify({ userId: parsed.data.toUserId, type: 'new_recommendation', payload: { from: user.id } });
  revalidatePath(`/p`);
  return { success: 'Recommandation publiée.' };
}

/** Bloquer / débloquer un utilisateur (blocker own). */
export async function toggleBlock(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/reseau');
  const blockedId = String(formData.get('blockedId') ?? '');
  const blocked = formData.get('blocked') === '1';
  if (blockedId === user.id) return;
  const supabase = await createClient();
  if (blocked) {
    await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
  } else {
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: blockedId });
  }
  revalidatePath('/espace/reseau');
  revalidatePath('/espace/messages');
}
