import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';
import type { Tables } from '@/types/database.types';

export interface PublicProfile {
  profile: Tables<'profiles'>;
  skills: { id: string; label: string }[];
  entities: {
    id: string;
    slug: string;
    type: Tables<'entities'>['type'];
    verified: boolean;
    city_name: string | null;
  }[];
}

export interface ProfileRecommendation {
  id: string;
  quality: string | null;
  text: string | null;
  from: { slug: string; first_name: string | null; last_name: string | null } | null;
}

/** Recommandations reçues (RLS reco_read : cible publique). Client anonyme, ISR. */
export async function getProfileRecommendations(userId: string): Promise<ProfileRecommendation[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('recommendations')
    .select('id, quality, text, from:profiles!recommendations_from_user_id_fkey(slug, first_name, last_name)')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as unknown as ProfileRecommendation[];
}

/**
 * Profil public par slug (F-04) — client anonyme (cache/ISR possible).
 * La RLS ne renvoie que visibility='public' et non supprimé ; un profil privé
 * ou inexistant → null → 404 côté page.
 */
export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const supabase = createPublicClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: skillRows }, { data: memberRows }] = await Promise.all([
    supabase
      .from('profile_skills')
      .select('skills(id, label)')
      .eq('profile_id', profile.user_id),
    supabase
      .from('entity_members')
      .select('entities!inner(id, slug, type, verified, city_name, status, deleted_at)')
      .eq('user_id', profile.user_id),
  ]);

  const skills = (skillRows ?? [])
    .map((r) => r.skills as unknown as { id: string; label: string } | null)
    .filter((s): s is { id: string; label: string } => Boolean(s));

  const entities = (memberRows ?? [])
    .map(
      (r) =>
        r.entities as unknown as {
          id: string;
          slug: string;
          type: Tables<'entities'>['type'];
          verified: boolean;
          city_name: string | null;
          status: string;
          deleted_at: string | null;
        },
    )
    .filter((e) => e.status === 'active' && e.deleted_at === null);

  return { profile, skills, entities };
}
