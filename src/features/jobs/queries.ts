import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Tables } from '@/types/database.types';

export type Job = Tables<'jobs'>;

export interface PublicJob extends Job {
  entity: { slug: string; type: Tables<'entities'>['type']; verified: boolean } | null;
  company_name: string | null;
}

type JobWithEntity = Job & {
  entity: { slug: string; type: Tables<'entities'>['type']; verified: boolean } | null;
};

/** Noms de sociétés indexés par entity_id (le lien job→company passe par l'entité). */
async function companyNames(entityIds: string[]): Promise<Map<string, string>> {
  if (entityIds.length === 0) return new Map();
  const supabase = createPublicClient();
  const { data } = await supabase.from('companies').select('entity_id, name').in('entity_id', entityIds);
  return new Map((data ?? []).map((c) => [c.entity_id, c.name]));
}

/** /emploi — offres publiées non expirées (client anonyme, ISR). */
export async function getPublishedJobs(region?: string): Promise<PublicJob[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from('jobs')
    .select('*, entity:entities!inner(slug, type, verified)')
    .eq('status', 'published')
    .is('deleted_at', null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .limit(50);
  if (region) query = query.eq('region', region);

  const { data } = await query;
  const rows = (data ?? []) as unknown as JobWithEntity[];
  const names = await companyNames(rows.map((j) => j.entity_id));
  return rows.map((j) => ({ ...j, company_name: names.get(j.entity_id) ?? null }));
}

/** /emploi/[slug] — une offre publiée. */
export async function getPublishedJobBySlug(slug: string): Promise<PublicJob | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('jobs')
    .select('*, entity:entities!inner(slug, type, verified)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  if (!data) return null;
  const job = data as unknown as JobWithEntity;
  const names = await companyNames([job.entity_id]);
  return { ...job, company_name: names.get(job.entity_id) ?? null };
}

/** F-10 — mes offres (recruteur) avec compteur de candidatures. */
export async function getMyJobs(userId: string) {
  const supabase = await createClient();
  const { data: memberships } = await supabase.from('entity_members').select('entity_id').eq('user_id', userId);
  const entityIds = (memberships ?? []).map((m) => m.entity_id);
  if (entityIds.length === 0) return [];

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, applications:job_applications(count)')
    .in('entity_id', entityIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return ((jobs ?? []) as unknown as (Job & { applications: { count: number }[] })[]).map((j) => ({
    ...j,
    applicationCount: j.applications?.[0]?.count ?? 0,
  }));
}

/** F-10 — candidatures reçues sur une offre (recruteur). */
export async function getJobApplications(jobId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('job_applications')
    .select(
      'id, status, message, cv_url, created_at, candidate:profiles!job_applications_candidate_profile_id_fkey(slug, first_name, last_name, headline)',
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

/** F-10 — mes candidatures (candidat). */
export async function getMyApplications(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('job_applications')
    .select('id, status, created_at, job:jobs!inner(slug, title, city_name, status)')
    .eq('candidate_profile_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}
