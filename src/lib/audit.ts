import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Journalisation d'audit — toute transition d'état ou action sensible écrit
 * une entrée audit_logs (INSERT service-role uniquement, table immuable).
 * Ne jette jamais : un échec d'audit est loggé mais ne bloque pas l'action
 * (l'action elle-même est déjà gardée par RLS + Zod).
 */
export async function audit(entry: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      reason: entry.reason ?? null,
    });
  } catch (e) {
    console.error('[audit] échec d’écriture audit_logs', e);
  }
}
