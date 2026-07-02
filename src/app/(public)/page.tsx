import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Accueil — convertir + recherche + preuve sociale (PRD 9.1).
 * Schema.org Organization + WebSite ; la recherche globale sera branchée sur
 * search_index (F-08). ISR.
 */
export const revalidate = 3600;

const TYPES = [
  {
    href: '/annuaire/societes',
    title: 'Sociétés de nettoyage',
    desc: 'Trouvez un prestataire vérifié près de chez vous, par service et par zone.',
  },
  {
    href: '/annuaire/fournisseurs',
    title: 'Fournisseurs',
    desc: 'Machines, produits, consommables, EPI, logiciels : tout l’équipement du métier.',
  },
  {
    href: '/annuaire/centres-formation',
    title: 'Centres de formation',
    desc: 'Organismes et formations du secteur : CQP, CACES, Qualiopi.',
  },
  {
    href: '/annuaire/independants',
    title: 'Indépendants',
    desc: 'Auto-entrepreneurs et indépendants de la propreté, disponibles en sous-traitance.',
  },
];

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'ClubProprete',
        url: process.env.NEXT_PUBLIC_SITE_URL,
        description:
          'Le réseau professionnel de toute la propreté française. Plateforme B2B entièrement gratuite.',
      },
      {
        '@type': 'WebSite',
        name: 'ClubProprete',
        url: process.env.NEXT_PUBLIC_SITE_URL,
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-navy px-4 py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-h1 font-bold text-white">
          Le réseau professionnel de toute la propreté française
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-body text-white/80">
          Un profil qui vous rend visible, un réseau qui vous fait travailler, un média que vous
          écrivez — <strong className="text-white">gratuitement</strong>.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: 'default' }))}>
            Créer mon profil gratuit
          </Link>
          <Link
            href="/annuaire/societes"
            className={cn(
              buttonVariants({ variant: 'secondary' }),
              'border-white/30 bg-transparent text-white hover:bg-white/10',
            )}
          >
            Explorer l&apos;annuaire
          </Link>
        </div>
      </section>

      {/* 4 types d'annuaire */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-h2 font-bold text-navy">Tout l&apos;écosystème, au même endroit</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <Link key={t.href} href={t.href} className="group">
              <Card className="h-full transition-colors group-hover:border-blue">
                <CardTitle className="group-hover:text-blue">{t.title}</CardTitle>
                <p className="mt-2 text-caption text-grey">{t.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Proposition de valeur */}
      <section className="bg-bg-light px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {[
            {
              title: '100 % gratuit',
              desc: 'Aucun abonnement, aucune mise en avant payante, aucune publicité. Jamais.',
            },
            {
              title: 'Fiches vérifiées',
              desc: 'Un badge de confiance délivré après vérification humaine de chaque entité.',
            },
            {
              title: 'Réseau vertical',
              desc: 'Connexions, messagerie, recommandations : le LinkedIn de la propreté.',
            },
          ].map((b) => (
            <div key={b.title}>
              <h3 className="text-h4 font-semibold text-navy">{b.title}</h3>
              <p className="mt-1 text-body text-grey">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
