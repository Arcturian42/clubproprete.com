import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { hasCapability } from '@/lib/auth/capabilities';
import { getMyJobs, getJobApplications } from '@/features/jobs/queries';
import { getMyVerifiedEntities } from '@/features/jobs/entity-helpers';
import { JobForm } from '@/features/jobs/components/job-form';
import { setJobStatus, setApplicationStatus } from '@/features/jobs/actions';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Mes offres' };

const APP_STATUS_LABELS: Record<string, string> = {
  submitted: 'Reçue',
  viewed: 'Vue',
  interview: 'Entretien',
  hired: 'Recruté',
  rejected: 'Refusée',
  withdrawn: 'Retirée',
};

/** F-10 — espace recruteur : publication + gestion des offres et candidatures. */
export default async function OffresPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const user = await requireUser('/espace/offres');
  const { published } = await searchParams;
  const canPublish = await hasCapability('publish_job');
  const [jobs, verifiedEntities] = await Promise.all([getMyJobs(user.id), getMyVerifiedEntities(user.id)]);

  // Candidatures par offre.
  const applicationsByJob = await Promise.all(
    jobs.map(async (j) => ({ jobId: j.id, apps: await getJobApplications(j.id) })),
  );
  const appsMap = new Map(applicationsByJob.map((x) => [x.jobId, x.apps]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-h2 font-bold text-navy">Mes offres</h1>
      {published && <Alert variant="success">Offre publiée et visible dans l&apos;espace emploi.</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Publier une offre</CardTitle>
        </CardHeader>
        {canPublish ? (
          <JobForm entities={verifiedEntities} />
        ) : (
          <Alert variant="warning">
            La publication d&apos;offres nécessite une entité <strong>vérifiée</strong>. Demandez la
            vérification depuis « Mes fiches ».
          </Alert>
        )}
      </Card>

      <section>
        <h2 className="mb-2 text-h4 font-semibold text-navy">Offres publiées</h2>
        {jobs.length === 0 ? (
          <EmptyState title="Aucune offre pour le moment." />
        ) : (
          <ul className="space-y-4">
            {jobs.map((j) => {
              const apps = appsMap.get(j.id) ?? [];
              return (
                <Card key={j.id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/emploi/${j.slug}`} className="text-body font-semibold text-navy hover:text-blue">
                        {j.title}
                      </Link>
                      <p className="text-caption text-grey">
                        {j.city_name} · {j.applicationCount} candidature(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={j.status === 'published' ? 'verified' : 'pending'}>{j.status}</Badge>
                      {j.status === 'published' ? (
                        <form action={setJobStatus}>
                          <input type="hidden" name="jobId" value={j.id} />
                          <input type="hidden" name="status" value="closed" />
                          <Button type="submit" size="sm" variant="ghost">Clôturer</Button>
                        </form>
                      ) : (
                        <form action={setJobStatus}>
                          <input type="hidden" name="jobId" value={j.id} />
                          <input type="hidden" name="status" value="published" />
                          <Button type="submit" size="sm" variant="ghost">Rouvrir</Button>
                        </form>
                      )}
                    </div>
                  </div>

                  {apps.length > 0 && (
                    <ul className="divide-y divide-navy/10 rounded-md border border-navy/10">
                      {apps.map((a) => {
                        const c = a.candidate as unknown as { slug: string; first_name: string | null; last_name: string | null; headline: string | null };
                        return (
                          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                            <div>
                              <Link href={`/p/${c?.slug}`} className="text-body font-medium text-navy hover:text-blue">
                                {`${c?.first_name ?? ''} ${c?.last_name ?? ''}`.trim() || c?.slug}
                              </Link>
                              <p className="text-caption text-grey">{c?.headline ?? '—'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{APP_STATUS_LABELS[a.status] ?? a.status}</Badge>
                              {['submitted', 'viewed', 'interview'].includes(a.status) && (
                                <div className="flex gap-1">
                                  {(['interview', 'hired', 'rejected'] as const).map((s) => (
                                    <form key={s} action={setApplicationStatus}>
                                      <input type="hidden" name="applicationId" value={a.id} />
                                      <input type="hidden" name="status" value={s} />
                                      <button
                                        type="submit"
                                        className="rounded-full border border-navy/20 px-2 py-1 text-[11px] text-grey hover:border-blue hover:text-blue"
                                      >
                                        {APP_STATUS_LABELS[s]}
                                      </button>
                                    </form>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
