'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';

/** Marque une notification comme lue (RLS notif_update own read_at). */
export async function markNotificationRead(id: string) {
  await requireUser('/espace/notifications');
  const supabase = await createClient();
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/espace/notifications');
}

/** Marque toutes les notifications comme lues. */
export async function markAllNotificationsRead() {
  const user = await requireUser('/espace/notifications');
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  revalidatePath('/espace/notifications');
}
