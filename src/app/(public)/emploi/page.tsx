import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Briefcase, BadgeCheck } from 'lucide-react';
import { getPublishedJobs } from '@/features/jobs/queries';
import { FR_REGIONS } from '@/config/regions';
import { EmptyState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Emploi — offres du secteur de la propreté',
  description:
    "Offres d'emploi de la propreté en France : agents, chefs d'équipe, encadrement. Candidature directe.",
  alternates: { canonical: '/emploi' },
};

export const revalidate = 300;

/** M10 — job board (offres publiées non expirées). */
export default async function EmploiPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const validRegion = region && (FR_REGIONS as readonly string[]).includes(region) ? region : undefined;
  const jobs = await getPublishedJobs(validRegion);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-h1 font-bold text-navy">L&apos;emploi de la propreté</h1>
      <p className="mt-1 max-w-2xl text-body text-grey">
        Offres publiées par des entreprises vérifiées. Candidature en deux clics.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="emploi-region" className="mb-1 block text-caption text-grey">
            Région
          </label>
          <select
            id="emploi-region"
            name="region"
            defaultValue={validRegion ?? ''}
            className="min-h-11 rounded-sm border border-navy/15 bg-white px-3 py-2 text-body text-navy"
          >
            <option value="">Toute la France</option>
            {FR_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={cn(buttonVariants({ size: 'sm' }))}>
          Filtrer
        </button>
      </form>

      {jobs.length === 0 ? (
        <EmptyState className="mt-8" title="Aucune offre pour le moment." description="Revenez bientôt ou créez une alerte." />
      ) : (
        <ul className="mt-8 space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link
                href={`/emploi/${j.slug}`}
                className="flex items-start gap-4 rounded-lg border border-navy/10 bg-white p-4 shadow-lift hover:border-blue"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ice text-blue">
                  <Briefcase className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-h4 font-semibold text-navy">{j.title}</h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-grey">
                    {j.company_name && (
                      <span className="inline-flex items-center gap-1">
                        {j.company_name}
                        {j.entity?.verified && <BadgeCheck className="h-3.5 w-3.5 text-teal" aria-hidden />}
                      </span>
                    )}
                    {j.city_name && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden /> {j.city_name}
                      </span>
                    )}
                  </p>
                </div>
                {j.contract_type && <Badge variant="outline">{j.contract_type.replace('_', ' ')}</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
