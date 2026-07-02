import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NotificationType } from '@/config/notifications';
import type { Json } from '@/types/database.types';

/**
 * Notification in-app (M14) — INSERT réservé service-role (RLS).
 * L'envoi email via notification_queue + Resend arrive avec MVP 2 ; les types
 * essentiels restent visibles in-app dès maintenant.
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  payload?: Record<string, Json>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      payload: (params.payload ?? {}) as Json,
    });
  } catch (e) {
    console.error('[notify] échec insertion notification', e);
  }
}

/** Notifie tous les détenteurs d'une capacité (ex. admin_queue → admin_panel). */
export async function notifyCapabilityHolders(params: {
  capability: string;
  type: NotificationType;
  payload?: Record<string, Json>;
}) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('user_capabilities')
      .select('user_id')
      .eq('capability', params.capability)
      .is('revoked_at', null);
    await Promise.all(
      (data ?? []).map((r) =>
        notify({ userId: r.user_id, type: params.type, payload: params.payload }),
      ),
    );
  } catch (e) {
    console.error('[notify] capability holders', e);
  }
}
