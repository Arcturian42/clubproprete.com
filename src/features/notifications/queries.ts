import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

export type Notification = Tables<'notifications'>;

/** Notifications de l'utilisateur courant (RLS notif_read : own). */
export async function getNotifications(limit = 30): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Nombre de notifications non lues (badge). */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}
