'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { createAdminClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import { CAPABILITIES, type Capability } from '@/config/capabilities';

/**
 * Gestion des capacités (M15) — capacité admin_panel requise.
 * Pose : upsert (réactive un cycle révoqué). Retrait : revoked_at=now()
 * (jamais de DELETE — l'historique complet vit dans audit_logs, chap. 17.4).
 * ⚠️ Step-up super_admin (T12) : à câbler au middleware avant l'ouverture
 * publique pour les changements de capacité critiques.
 */
export async function grantCapability(formData: FormData) {
  const actor = await requireUser('/admin/utilisateurs');
  await requireCapability('admin_panel');

  const userId = String(formData.get('userId') ?? '');
  const capability = String(formData.get('capability') ?? '') as Capability;
  if (!userId || !CAPABILITIES.includes(capability)) return;

  const admin = createAdminClient();
  await admin.from('user_capabilities').upsert({
    user_id: userId,
    capability,
    source: 'admin_grant',
    granted_at: new Date().toISOString(),
    revoked_at: null,
  });
  await audit({
    actorId: actor.id,
    action: 'capability_grant',
    targetType: 'user',
    targetId: userId,
    reason: capability,
  });
  revalidatePath('/admin/utilisateurs');
}

export async function revokeCapability(formData: FormData) {
  const actor = await requireUser('/admin/utilisateurs');
  await requireCapability('admin_panel');

  const userId = String(formData.get('userId') ?? '');
  const capability = String(formData.get('capability') ?? '') as Capability;
  if (!userId || !CAPABILITIES.includes(capability)) return;

  const admin = createAdminClient();
  await admin
    .from('user_capabilities')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('capability', capability);
  await audit({
    actorId: actor.id,
    action: 'capability_revoke',
    targetType: 'user',
    targetId: userId,
    reason: capability,
  });
  revalidatePath('/admin/utilisateurs');
}
