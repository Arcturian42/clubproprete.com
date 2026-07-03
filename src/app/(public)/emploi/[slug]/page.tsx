import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, BadgeCheck } from 'lucide-react';
import { getPublishedJobBySlug } from '@/features/jobs/queries';
import { ENTITY_TYPE_SLUGS } from '@/config/routes';
import { ApplyForm } from '@/features/jobs/components/apply-form';
import { Badge } from '@/components/ui/badge';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublishedJobBySlug(slug);
  if (!job) return { title: 'Offre introuvable' };
  return {
    title: `${job.title}${job.city_name ? ` — ${job.city_name}` : ''}`,
    description: job.description?.slice(0, 160) ?? undefined,
    alternates: { canonical: `/emploi/${slug}` },
  };
}

/** M10 — offre publiée (JobPosting schema.org). */
export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getPublishedJobBySlug(slug);
  if (!job) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ?? undefined,
    datePosted: job.published_at ?? undefined,
    validThrough: job.expires_at ?? undefined,
    employmentType: job.contract_type ?? undefined,
    hiringOrganization: job.company_name ? { '@type': 'Organization', name: job.company_name } : undefined,
    jobLocation: job.city_name
      ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city_name, addressCountry: 'FR' } }
      : undefined,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/emploi" className="text-caption text-blue underline">
        ← Toutes les offres
      </Link>

      <h1 className="mt-4 text-h1 font-bold text-navy">{job.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-grey">
        {job.company_name && job.entity && (
          <Link
            href={`/${ENTITY_TYPE_SLUGS[job.entity.type]}/${job.entity.slug}`}
            className="inline-flex items-center gap-1 font-medium text-navy hover:text-blue"
          >
            {job.company_name}
            {job.entity.verified && <BadgeCheck className="h-4 w-4 text-teal" aria-hidden />}
          </Link>
        )}
        {job.city_name && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden /> {job.city_name}
          </span>
        )}
        {job.contract_type && <Badge variant="outline">{job.contract_type.replace('_', ' ')}</Badge>}
      </p>

      <div className="mt-6 whitespace-pre-line text-body leading-relaxed text-navy">{job.description}</div>

      <section className="mt-10 rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        <h2 className="mb-4 text-h4 font-semibold text-navy">Postuler</h2>
        <ApplyForm jobId={job.id} />
      </section>
    </main>
  );
}
