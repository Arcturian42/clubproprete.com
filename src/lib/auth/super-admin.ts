import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

/**
 * Élévation super_admin — F-02 étape 2 (PRD 5.1) :
 * si l'email ∈ SUPER_ADMIN_EMAILS, pose `moderate` + `admin_panel` (idempotent)
 * et aligne main_role='super_admin'. Appelée à chaque connexion réussie.
 * Chaque pose réelle est journalisée dans audit_logs.
 */
export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function elevateSuperAdminIfNeeded(userId: string, email: string | null | undefined) {
  if (!isSuperAdminEmail(email)) return;

  const admin = createAdminClient();

  for (const capability of ['moderate', 'admin_panel'] as const) {
    // Idempotent : upsert (PK user_id+capability), réactive si révoquée.
    const { data: existing } = await admin
      .from('user_capabilities')
      .select('revoked_at')
      .eq('user_id', userId)
      .eq('capability', capability)
      .maybeSingle();

    const alreadyActive = existing && existing.revoked_at === null;
    if (alreadyActive) continue;

    await admin.from('user_capabilities').upsert({
      user_id: userId,
      capability,
      source: 'super_admin_env',
      granted_at: new Date().toISOString(),
      revoked_at: null,
    });
    await audit({
      actorId: userId,
      action: 'capability_grant',
      targetType: 'user',
      targetId: userId,
      reason: `super_admin: ${capability} (SUPER_ADMIN_EMAILS)`,
    });
  }

  await admin
    .from('profiles')
    .update({ main_role: 'super_admin' })
    .eq('user_id', userId)
    .neq('main_role', 'super_admin');
}
