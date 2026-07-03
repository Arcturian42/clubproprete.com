import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** F-18 — missions publiées visibles (RLS : access_subcontracting). */
export async function getMissions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('missions')
    .select('id, creator_id, title, description, city_name, status, created_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

/** Mes candidatures aux missions. */
export async function getMyMissionApplications(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('mission_applications')
    .select('mission_id, status')
    .eq('applicant_user_id', userId);
  return data ?? [];
}

/** Candidatures reçues sur mes missions (créateur). */
export async function getApplicationsForMyMissions(userId: string) {
  const supabase = await createClient();
  const { data: missions } = await supabase.from('missions').select('id, title').eq('creator_id', userId);
  const missionIds = (missions ?? []).map((m) => m.id);
  if (missionIds.length === 0) return { missions: [], applications: [] };
  const { data: applications } = await supabase
    .from('mission_applications')
    .select('id, mission_id, status, applicant:profiles!mission_applications_applicant_user_id_fkey(slug, first_name, last_name)')
    .in('mission_id', missionIds);
  return { missions: missions ?? [], applications: applications ?? [] };
}
