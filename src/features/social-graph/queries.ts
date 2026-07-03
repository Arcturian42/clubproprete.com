import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface ProfileMini {
  user_id: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  photo_url: string | null;
}

export interface NetworkData {
  incoming: ProfileMini[]; // demandes reçues (à accepter)
  connections: ProfileMini[]; // connexions acceptées
  pendingOut: ProfileMini[]; // demandes envoyées
}

const PROFILE_COLS = 'user_id, slug, first_name, last_name, headline, photo_url';

/** F-09 — réseau de l'utilisateur (connexions + demandes). */
export async function getNetwork(userId: string): Promise<NetworkData> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('connections')
    .select(
      `status, from_user_id, to_user_id,
       from_profile:profiles!connections_from_user_id_fkey(${PROFILE_COLS}),
       to_profile:profiles!connections_to_user_id_fkey(${PROFILE_COLS})`,
    )
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  const incoming: ProfileMini[] = [];
  const connections: ProfileMini[] = [];
  const pendingOut: ProfileMini[] = [];

  for (const row of data ?? []) {
    const from = row.from_profile as unknown as ProfileMini;
    const to = row.to_profile as unknown as ProfileMini;
    const other = row.from_user_id === userId ? to : from;
    if (!other) continue;
    if (row.status === 'accepted') connections.push(other);
    else if (row.to_user_id === userId) incoming.push(other);
    else pendingOut.push(other);
  }
  return { incoming, connections, pendingOut };
}

/** Relation entre l'utilisateur courant et une cible (pour les CTA du profil). */
export async function getRelationship(userId: string, targetId: string) {
  const supabase = await createClient();
  const [{ data: conn }, { data: follow }, { data: block }] = await Promise.all([
    supabase
      .from('connections')
      .select('status, from_user_id')
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${targetId}),and(from_user_id.eq.${targetId},to_user_id.eq.${userId})`,
      )
      .maybeSingle(),
    supabase.from('follows').select('id').eq('from_user_id', userId).eq('to_user_id', targetId).maybeSingle(),
    supabase.from('blocks').select('id').eq('blocker_id', userId).eq('blocked_id', targetId).maybeSingle(),
  ]);

  return {
    connectionStatus: conn?.status ?? null,
    connectionInitiatedByMe: conn?.from_user_id === userId,
    isFollowing: Boolean(follow),
    hasBlocked: Boolean(block),
  };
}
