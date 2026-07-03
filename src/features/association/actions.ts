'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify, notifyCapabilityHolders } from '@/lib/notifications/notify';
import { t } from '@/i18n/fr';

/** F-11 — candidater à l'adhésion (unicité user). */
export async function requestMembership(): Promise<{ error?: string; success?: string }> {
  const user = await requireUser('/espace/sous-traitance');
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('association_memberships')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) {
    return { error: existing.status === 'approved' ? 'Vous êtes déjà membre.' : 'Votre candidature est déjà en cours.' };
  }

  const { error } = await supabase
    .from('association_memberships')
    .insert({ user_id: user.id, status: 'pending' });
  if (error) return { error: t('error_generic') };

  await audit({ actorId: user.id, action: 'membership_requested', targetType: 'user', targetId: user.id });
  await notifyCapabilityHolders({ capability: 'moderate', type: 'admin_queue', payload: { kind: 'membership' } });
  revalidatePath('/espace/sous-traitance');
  return { success: 'Candidature d\'adhésion envoyée. Vous serez notifié de la décision.' };
}

/**
 * F-11 — décision d'adhésion (capacité moderate).
 * approved → pose access_subcontracting + publish_mission (débloque la
 * sous-traitance) ; revoked → retire ces capacités.
 */
export async function decideMembership(formData: FormData): Promise<void> {
  const moderator = await requireUser('/admin/demandes');
  await requireCapability('moderate');
  const id = String(formData.get('membershipId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = (formData.get('reason') as string) || null;
  if (!id || !['approved', 'rejected'].includes(decision)) redirect('/admin/demandes');
  if (decision === 'rejected' && (!reason || reason.length < 3)) redirect('/admin/demandes?error=reason');

  const supabase = await createClient();
  const { data: m } = await supabase
    .from('association_memberships')
    .select('user_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!m || m.status !== 'pending') redirect('/admin/demandes?error=concurrent');

  await supabase
    .from('association_memberships')
    .update({
      status: decision as 'approved' | 'rejected',
      reason,
      decided_by: moderator.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending');

  if (decision === 'approved') {
    const admin = createAdminClient();
    for (const cap of ['access_subcontracting', 'publish_mission'] as const) {
      await admin.from('user_capabilities').upsert({
        user_id: m.user_id,
        capability: cap,
        source: 'status:association_member',
        granted_at: new Date().toISOString(),
        revoked_at: null,
      });
    }
  }

  await audit({ actorId: moderator.id, action: `membership_${decision}`, targetType: 'user', targetId: m.user_id, reason: reason ?? undefined });
  await notify({ userId: m.user_id, type: 'membership_decision', payload: { decision, reason } });
  redirect('/admin/demandes?done=1');
}
