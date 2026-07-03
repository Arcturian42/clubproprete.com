'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notifications/notify';
import { slugWithSuffix } from '@/lib/slug';
import { t } from '@/i18n/fr';
import { jobSchema, jobApplicationSchema, jobAlertSchema } from './schemas';

export type JobFormState = { error?: string; fieldErrors?: Record<string, string>; success?: string };

function fieldErrs(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/**
 * F-10 — publier une offre (RLS jobs_insert : publish_job + membre entité
 * vérifiée). Le trigger sync_search_job l'indexe (géo T1). expires_at calculé.
 */
export async function publishJob(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const user = await requireUser('/espace/offres');
  await requireCapability('publish_job');

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('payload') ?? '{}'));
  } catch {
    return { error: t('error_validation') };
  }
  const parsed = jobSchema.safeParse(raw);
  if (!parsed.success) return { error: t('error_validation'), fieldErrors: fieldErrs(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + input.expiresInDays * 86400_000).toISOString();

  const base = {
    entity_id: input.entityId,
    title: input.title,
    contract_type: input.contractType,
    description: input.description,
    city_name: input.city.cityName,
    insee_code: input.city.inseeCode,
    region: input.city.region,
    lat: input.city.lat,
    lng: input.city.lng,
    expires_at: expiresAt,
  };

  if (input.id) {
    const { error } = await supabase.from('jobs').update(base).eq('id', input.id);
    if (error) return { error: t('error_forbidden') };
    revalidatePath('/espace/offres');
    return { success: 'Offre mise à jour.' };
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...base,
      slug: slugWithSuffix(input.title),
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !data) {
    return { error: "Publication refusée : votre entité doit être vérifiée pour publier une offre." };
  }

  await audit({ actorId: user.id, action: 'job_published', targetType: 'job', targetId: data.id });
  redirect('/espace/offres?published=1');
}

/** F-10 — clôturer / rouvrir une offre (recruteur, membre). */
export async function setJobStatus(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/offres');
  const id = String(formData.get('jobId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['published', 'closed', 'archived'].includes(status)) redirect('/espace/offres');
  const supabase = await createClient();
  await supabase
    .from('jobs')
    .update({
      status: status as 'published' | 'closed' | 'archived',
      closed_at: status === 'closed' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  await audit({ actorId: user.id, action: `job_${status}`, targetType: 'job', targetId: id });
  revalidatePath('/espace/offres');
}

/** F-10 — postuler à une offre (RLS japp_insert : candidat). */
export async function applyToJob(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const user = await requireUser('/emploi');
  const parsed = jobApplicationSchema.safeParse({
    jobId: formData.get('jobId'),
    message: (formData.get('message') as string) || undefined,
    cvUrl: (formData.get('cvUrl') as string) || undefined,
  });
  if (!parsed.success) return { error: t('error_validation') };

  const supabase = await createClient();
  const { error } = await supabase.from('job_applications').insert({
    job_id: parsed.data.jobId,
    candidate_profile_id: user.id,
    message: parsed.data.message ?? null,
    cv_url: parsed.data.cvUrl ?? null,
    status: 'submitted',
  });
  if (error) return { error: 'Vous avez déjà candidaté à cette offre.' };

  // Notifie le recruteur (membre de l'entité).
  const { data: job } = await supabase.from('jobs').select('entity_id, title').eq('id', parsed.data.jobId).maybeSingle();
  if (job) {
    const { data: members } = await supabase
      .from('entity_members')
      .select('user_id')
      .eq('entity_id', job.entity_id);
    for (const m of members ?? []) {
      await notify({ userId: m.user_id, type: 'job_application_received', payload: { job_id: parsed.data.jobId } });
    }
  }
  await audit({ actorId: user.id, action: 'job_application', targetType: 'job', targetId: parsed.data.jobId });
  return { success: 'Candidature envoyée.' };
}

/** F-10 — recruteur fait évoluer le statut d'une candidature. */
export async function setApplicationStatus(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/offres');
  const id = String(formData.get('applicationId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['viewed', 'interview', 'hired', 'rejected'].includes(status)) redirect('/espace/offres');
  const supabase = await createClient();
  const { data: app } = await supabase
    .from('job_applications')
    .update({ status: status as 'viewed' | 'interview' | 'hired' | 'rejected' })
    .eq('id', id)
    .select('candidate_profile_id, job_id')
    .maybeSingle();
  if (app) {
    await notify({ userId: app.candidate_profile_id, type: 'application_status', payload: { job_id: app.job_id, status } });
    await audit({ actorId: user.id, action: `application_${status}`, targetType: 'job', targetId: app.job_id });
  }
  revalidatePath('/espace/offres');
}

/** F-10 — candidat retire sa candidature (2C : withdrawn uniquement). */
export async function withdrawApplication(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/candidatures');
  const id = String(formData.get('applicationId') ?? '');
  const supabase = await createClient();
  await supabase
    .from('job_applications')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .eq('candidate_profile_id', user.id);
  revalidatePath('/espace/candidatures');
}

/** F-10 — créer une alerte emploi. */
export async function createJobAlert(formData: FormData): Promise<void> {
  const user = await requireUser('/emploi');
  const parsed = jobAlertSchema.safeParse({
    roleQuery: (formData.get('roleQuery') as string) || undefined,
    area: (formData.get('area') as string) || undefined,
    frequency: formData.get('frequency') || 'daily',
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from('job_alerts').insert({
    user_id: user.id,
    role_query: parsed.data.roleQuery ?? null,
    area: parsed.data.area ?? null,
    frequency: parsed.data.frequency,
  });
  revalidatePath('/espace/candidatures');
}
