'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notifications/notify';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { t } from '@/i18n/fr';

/** Clé directe déterministe (miroir du trigger enforce_direct_two_members). */
function directKey(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/**
 * F-24/F-15 — ouvre (ou réutilise) une conversation directe avec un autre
 * utilisateur et redirige vers le fil. Aucune table `leads` : le contact d'une
 * fiche crée une conversation + notification.
 */
export async function startDirectConversation(targetUserId: string): Promise<string | null> {
  const user = await requireUser('/espace/messages');
  if (!z.string().uuid().safeParse(targetUserId).success || targetUserId === user.id) return null;

  try {
    await rateLimit('new_conversations', user.id);
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
  }

  const supabase = await createClient();
  const key = directKey(user.id, targetUserId);

  // Réutilise la conversation directe existante (unicité direct_key).
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('direct_key', key)
    .maybeSingle();
  if (existing) return existing.id;

  // Crée la conversation (RLS conv_insert : créateur) + les 2 membres.
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: user.id })
    .select('id')
    .single();
  if (error || !conv) return null;

  const { error: memberError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetUserId },
    ]);
  if (memberError) return null;

  await audit({ actorId: user.id, action: 'conversation_started', targetType: 'profile', targetId: targetUserId });
  return conv.id;
}

/** Action de formulaire : contacter depuis un profil. */
export async function contactUser(formData: FormData): Promise<void> {
  const targetUserId = String(formData.get('targetUserId') ?? '');
  const conversationId = await startDirectConversation(targetUserId);
  if (!conversationId) redirect('/espace/messages?error=1');
  redirect(`/espace/messages/${conversationId}`);
}

/**
 * F-24 — contacter une fiche : ouvre une conversation avec son owner
 * (aucune table `leads`). Redirige vers /login si anonyme (garde requireUser).
 */
export async function contactEntity(formData: FormData): Promise<void> {
  const entityId = String(formData.get('entityId') ?? '');
  const user = await requireUser(`/`);
  const supabase = await createClient();
  const { data: owner } = await supabase
    .from('entity_members')
    .select('user_id')
    .eq('entity_id', entityId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();
  if (!owner || owner.user_id === user.id) redirect('/espace/messages?error=1');
  const conversationId = await startDirectConversation(owner.user_id);
  if (!conversationId) redirect('/espace/messages?error=1');
  redirect(`/espace/messages/${conversationId}`);
}

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Message vide.').max(4000),
});

/** F-15 — envoyer un message (RLS : sender + participant + not blocked ; 30/min). */
export async function sendMessage(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser('/espace/messages');
  const parsed = messageSchema.safeParse({
    conversationId: formData.get('conversationId'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t('error_validation') };

  try {
    await rateLimit('messages', user.id);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (error) {
    // RLS refuse si non-participant ou bloqué (F-15.3).
    return { error: 'Message non envoyé (vous avez peut-être été bloqué).' };
  }

  // Touche updated_at de la conversation + notifie les autres participants hors-ligne.
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', parsed.data.conversationId);

  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', parsed.data.conversationId)
    .neq('user_id', user.id);
  for (const m of members ?? []) {
    await notify({ userId: m.user_id, type: 'new_message', payload: { conversation_id: parsed.data.conversationId } });
  }

  revalidatePath(`/espace/messages/${parsed.data.conversationId}`);
  return {};
}

/** T4 — accusé de lecture global par conversation (last_read_at). */
export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireUser('/espace/messages');
  const supabase = await createClient();
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}
