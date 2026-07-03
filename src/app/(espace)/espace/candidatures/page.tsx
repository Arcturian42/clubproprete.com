import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { getMyApplications } from '@/features/jobs/queries';
import { withdrawApplication } from '@/features/jobs/actions';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Mes candidatures' };

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Envoyée',
  viewed: 'Vue par le recruteur',
  interview: 'Entretien',
  hired: 'Recruté',
  rejected: 'Non retenue',
  withdrawn: 'Retirée',
};

/** F-10 — mes candidatures (candidat). */
export default async function CandidaturesPage() {
  const user = await requireUser('/espace/candidatures');
  const applications = await getMyApplications(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h2 font-bold text-navy">Mes candidatures</h1>

      {applications.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Aucune candidature."
          description="Parcourez les offres et postulez en deux clics."
          action={
            <Link href="/emploi" className="font-medium text-blue underline">
              Voir les offres
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {applications.map((a) => {
            const job = a.job as unknown as { slug: string; title: string; city_name: string | null };
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy/10 bg-white p-4">
                <div>
                  <Link href={`/emploi/${job?.slug}`} className="text-body font-medium text-navy hover:text-blue">
                    {job?.title}
                  </Link>
                  <p className="text-caption text-grey">
                    {job?.city_name} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'hired' ? 'verified' : a.status === 'rejected' ? 'error' : 'outline'}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                  {['submitted', 'viewed', 'interview'].includes(a.status) && (
                    <form action={withdrawApplication}>
                      <input type="hidden" name="applicationId" value={a.id} />
                      <Button type="submit" size="sm" variant="ghost">Retirer</Button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
