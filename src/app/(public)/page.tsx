import Link from 'next/link';
import {
  Building2,
  Package,
  GraduationCap,
  UserRound,
  BadgeCheck,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Accueil — convertir + recherche + preuve sociale (PRD 9.1).
 * Design v2 : hero « eau claire » (dégradés bleus superposés), panneaux de
 * verre, bento asymétrique. Schema.org Organization + WebSite. ISR.
 */
export const revalidate = 3600;

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
      { '@type': 'WebSite', name: 'ClubProprete', url: process.env.NEXT_PUBLIC_SITE_URL },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ——— Hero « eau claire » ——— */}
      <section className="hero-water relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-caption font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden />
              Plateforme 100 % gratuite — sans publicité, sans premium
            </p>
            <h1 className="mt-6 max-w-xl text-h1 font-bold text-white sm:text-h1-lg">
              Le réseau professionnel de toute la{' '}
              <em className="not-italic text-sky">propreté</em> française
            </h1>
            <p className="mt-5 max-w-lg text-body leading-relaxed text-white/75">
              Un profil qui vous rend visible, un réseau qui vous fait travailler, un média que
              vous écrivez. 30 000 entreprises, enfin au même endroit.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }))}>
                Créer mon profil gratuit
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/annuaire/societes"
                className={cn(buttonVariants({ variant: 'glass-dark', size: 'lg' }))}
              >
                Explorer l&apos;annuaire
              </Link>
            </div>
          </div>

          {/* Panneaux flottants — aperçu produit, décoratif */}
          <div className="relative hidden pb-16 lg:col-span-5 lg:block" aria-hidden>
            <div className="glass-dark rounded-lg p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue/30 text-sky">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">Net&apos;Éclat Services</p>
                  <p className="flex items-center gap-1 text-caption text-white/60">
                    <MapPin className="h-3 w-3" /> Lyon 3ᵉ · Nettoyage de bureaux
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-caption font-medium text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Vérifiée
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['12', 'services'],
                  ['4,9', 'recommandations'],
                  ['98 %', 'profil complété'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-md bg-white/5 px-2 py-3">
                    <p className="text-h4 font-bold text-white">{v}</p>
                    <p className="text-[11px] text-white/55">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-dark absolute -bottom-2 left-6 w-60 rounded-lg p-4">
              <p className="text-caption text-white/60">Nouvelle mise en relation</p>
              <p className="mt-1 text-body font-medium text-white">
                « Bonjour, disponible pour un chantier à Villeurbanne ? »
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Annuaire : bento asymétrique ——— */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-h2 font-bold text-navy">
              Tout l&apos;écosystème, au même endroit
            </h2>
            <p className="mt-1 text-body text-grey">
              Quatre annuaires, une seule recherche, zéro mise en avant payante.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-6">
          <Link
            href="/annuaire/societes"
            className="group relative overflow-hidden rounded-lg bg-navy p-6 sm:col-span-4"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(30rem 16rem at 90% -20%, rgba(124,196,248,.25), transparent 60%)',
              }}
              aria-hidden
            />
            <Building2 className="h-6 w-6 text-sky" aria-hidden />
            <h3 className="mt-4 text-h3 font-semibold text-white">Sociétés de nettoyage</h3>
            <p className="mt-1 max-w-md text-body text-white/65">
              Prestataires vérifiés, filtrables par service et par zone d&apos;intervention —
              du bureau au site industriel.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-body font-medium text-sky">
              Parcourir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>

          <Link
            href="/annuaire/fournisseurs"
            className="group rounded-lg border border-navy/10 bg-ice p-6 transition-shadow hover:shadow-lift-lg sm:col-span-2"
          >
            <Package className="h-6 w-6 text-blue" aria-hidden />
            <h3 className="mt-4 text-h4 font-semibold text-navy">Fournisseurs</h3>
            <p className="mt-1 text-caption text-grey">
              Machines, produits, consommables, EPI, logiciels.
            </p>
          </Link>

          <Link
            href="/annuaire/centres-formation"
            className="group rounded-lg border border-navy/10 bg-white p-6 shadow-lift transition-shadow hover:shadow-lift-lg sm:col-span-3"
          >
            <GraduationCap className="h-6 w-6 text-blue" aria-hidden />
            <h3 className="mt-4 text-h4 font-semibold text-navy">Centres de formation</h3>
            <p className="mt-1 text-caption text-grey">
              CQP propreté, CACES, SST, Qualiopi : montez vos équipes en compétence.
            </p>
          </Link>

          <Link
            href="/annuaire/independants"
            className="group rounded-lg border border-navy/10 bg-white p-6 shadow-lift transition-shadow hover:shadow-lift-lg sm:col-span-3"
          >
            <UserRound className="h-6 w-6 text-blue" aria-hidden />
            <h3 className="mt-4 text-h4 font-semibold text-navy">Indépendants</h3>
            <p className="mt-1 text-caption text-grey">
              Auto-entrepreneurs disponibles en renfort ou en sous-traitance.
            </p>
          </Link>
        </div>
      </section>

      {/* ——— Pourquoi — bande numérotée, pas de cartes jumelles ——— */}
      <section className="border-y border-navy/10 bg-ice px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Gratuit, vraiment',
              desc: 'Aucun abonnement, aucune fiche sponsorisée, aucune publicité. La visibilité se gagne par la qualité du profil, pas par le budget.',
            },
            {
              n: '02',
              title: 'Confiance vérifiée',
              desc: 'Chaque badge « Vérifiée » est délivré après un contrôle humain : SIRET, activité réelle, coordonnées.',
            },
            {
              n: '03',
              title: 'Un vrai réseau métier',
              desc: 'Connexions, messagerie temps réel, recommandations entre pairs : le LinkedIn vertical de la propreté.',
            },
          ].map((b) => (
            <div key={b.n} className="border-l-2 border-blue pl-5">
              <p className="font-mono text-caption text-blue">{b.n}</p>
              <h3 className="mt-2 text-h4 font-semibold text-navy">{b.title}</h3>
              <p className="mt-2 text-body leading-relaxed text-grey">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
