import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

import 'server-only';

/**
 * Client service-role — CONTOURNE LA RLS. À n'utiliser QUE côté serveur, pour
 * les opérations d'infrastructure : worker de notifications, purge Storage,
 * accès aux tables service-role (slug_history, email_deliveries,
 * notification_queue, rate_limits). Ne JAMAIS importer côté client.
 *
 * Toute mutation sensible faite ici doit rester journalisée (audit_logs) et
 * re-vérifier l'autorisation en amont — le service-role n'est pas une capacité.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante (client admin serveur uniquement).');
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
