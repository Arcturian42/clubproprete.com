'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notifications/notify';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { t } from '@/i18n/fr';

const reportSchema = z.object({
  targetType: z.enum(['article', 'profile', 'message', 'recommendation', 'entity']),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Précisez le motif.').max(500),
});

/** F-14 — signaler un contenu (20/j/user). */
export async function reportContent(formData: FormData): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/');
  const parsed = reportSchema.safeParse({
    targetType: formData.get('targetType'),
    targetId: formData.get('targetId'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t('error_validation') };

  try {
    await rateLimit('reports', user.id);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    status: 'open',
  });
  if (error) return { error: t('error_generic') };

  await audit({
    actorId: user.id,
    action: 'report_created',
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
  });
  return { success: 'Signalement transmis à la modération. Merci.' };
}

/**
 * F-14 — traiter un signalement (capacité moderate).
 * dismiss : classe sans suite. actioned : décision (hide/warn/suspend) +
 * moderation_decisions (immuable) + récidive auto (3 décisions validées / 24 h
 * sur un même auteur → suspension automatique).
 */
export async function resolveReport(formData: FormData): Promise<void> {
  const moderator = await requireUser('/admin/moderation');
  await requireCapability('moderate');

  const reportId = String(formData.get('reportId') ?? '');
  const action = String(formData.get('action') ?? ''); // dismiss | hide | warn | suspend
  const reason = (formData.get('reason') as string) || 'Décision de modération';
  if (!reportId) redirect('/admin/moderation');

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: report } = await supabase
    .from('reports')
    .select('id, target_type, target_id, status')
    .eq('id', reportId)
    .maybeSingle();
  if (!report || report.status !== 'open') redirect('/admin/moderation?error=concurrent');

  if (action === 'dismiss') {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId);
    await audit({ actorId: moderator.id, action: 'report_dismissed', targetType: report.target_type, targetId: report.target_id });
    redirect('/admin/moderation?done=1');
  }

  // Décision effective.
  await supabase.from('reports').update({ status: 'actioned' }).eq('id', reportId);
  await admin.from('moderation_decisions').insert({
    report_id: reportId,
    target_type: report.target_type,
    target_id: report.target_id,
    moderator_id: moderator.id,
    action: action as 'hide' | 'warn' | 'suspend',
    scope: action === 'suspend' ? 'user' : 'content',
    duration_hours: action === 'suspend' ? 24 : null,
    reason,
  });

  // Effet sur le contenu.
  const targetAuthor = await applyModerationEffect(admin, report.target_type, report.target_id, action);

  // Notifie l'auteur (moderation_action, essentielle).
  if (targetAuthor) {
    await notify({
      userId: targetAuthor,
      type: 'moderation_action',
      payload: { target_type: report.target_type, action, reason },
    });
    // Récidive : 3 décisions actionnées / 24 h → suspension auto 24 h.
    await maybeAutoSuspend(admin, targetAuthor);
  }

  await audit({
    actorId: moderator.id,
    action: `moderation_${action}`,
    targetType: report.target_type,
    targetId: report.target_id,
    reason,
  });
  redirect('/admin/moderation?done=1');
}

type AdminClient = ReturnType<typeof createAdminClient>;

/** Applique l'effet de modération et renvoie l'auteur du contenu (pour notif/récidive). */
async function applyModerationEffect(
  admin: AdminClient,
  targetType: string,
  targetId: string,
  action: string,
): Promise<string | null> {
  const hide = action === 'hide' || action === 'suspend';
  if (targetType === 'article') {
    const { data } = await admin.from('articles').select('author_id').eq('id', targetId).maybeSingle();
    if (hide) await admin.from('articles').update({ deleted_at: new Date().toISOString() }).eq('id', targetId);
    return data?.author_id ?? null;
  }
  if (targetType === 'message') {
    const { data } = await admin.from('messages').select('sender_id').eq('id', targetId).maybeSingle();
    if (hide) await admin.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', targetId);
    return data?.sender_id ?? null;
  }
  if (targetType === 'recommendation') {
    const { data } = await admin.from('recommendations').select('from_user_id').eq('id', targetId).maybeSingle();
    if (hide) await admin.from('recommendations').delete().eq('id', targetId);
    return data?.from_user_id ?? null;
  }
  if (targetType === 'entity') {
    if (hide) await admin.from('entities').update({ status: 'suspended' }).eq('id', targetId);
    return null;
  }
  if (targetType === 'profile') {
    return targetId; // profiles PK = user_id
  }
  return null;
}

/** Récidive auto (PRD 21.3) : 3 décisions actionnées / 24 h → retrait des capacités d'écriture. */
async function maybeAutoSuspend(admin: AdminClient, userId: string) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  // On compte les décisions récentes visant l'auteur via ses contenus signalés.
  const { count } = await admin
    .from('moderation_decisions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('scope', 'user');
  if ((count ?? 0) >= 3) {
    for (const cap of ['write_article', 'publish_job', 'publish_mission', 'access_subcontracting'] as const) {
      await admin
        .from('user_capabilities')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('capability', cap)
        .is('revoked_at', null);
    }
    await audit({
      actorId: userId,
      action: 'auto_suspend_24h',
      targetType: 'user',
      targetId: userId,
      reason: '3 décisions de modération en 24 h',
    });
  }
}

/** F-14 — un modérateur signale (flag) un message (B4 : messages_update moderate). */
export async function flagMessage(formData: FormData): Promise<void> {
  const moderator = await requireUser('/admin/moderation');
  await requireCapability('moderate');
  const id = String(formData.get('messageId') ?? '');
  const supabase = await createClient();
  await supabase.from('messages').update({ flagged: true }).eq('id', id);
  await audit({ actorId: moderator.id, action: 'message_flagged', targetType: 'message', targetId: id });
  revalidatePath('/admin/moderation');
}

/** F-12 — décision sur une candidature rédacteur (approve → write_article). */
export async function decideAuthorApplication(formData: FormData): Promise<void> {
  const moderator = await requireUser('/admin/demandes');
  await requireCapability('moderate');
  const id = String(formData.get('applicationId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = (formData.get('reason') as string) || null;
  if (!id || !['approved', 'rejected'].includes(decision)) redirect('/admin/demandes');
  if (decision === 'rejected' && (!reason || reason.length < 3)) redirect('/admin/demandes?error=reason');

  const supabase = await createClient();
  const { data: app } = await supabase
    .from('author_applications')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!app || app.status !== 'pending') redirect('/admin/demandes?error=concurrent');

  await supabase
    .from('author_applications')
    .update({ status: decision, reason, decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');

  const admin = createAdminClient();
  if (decision === 'approved') {
    await admin.from('user_capabilities').upsert({
      user_id: app.user_id,
      capability: 'write_article',
      source: 'author_application',
      granted_at: new Date().toISOString(),
      revoked_at: null,
    });
    // Promotion identité author si non déjà élevé.
    await admin.from('profiles').update({ main_role: 'author' }).eq('user_id', app.user_id).eq('main_role', 'registered_user');
  }

  await audit({ actorId: moderator.id, action: `author_${decision}`, targetType: 'user', targetId: app.user_id, reason: reason ?? undefined });
  await notify({ userId: app.user_id, type: 'author_decision', payload: { decision, reason } });
  redirect('/admin/demandes?done=1');
}
