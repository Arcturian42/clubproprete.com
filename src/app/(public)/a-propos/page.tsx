import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'ClubProprete.com : la plateforme B2B gratuite qui connecte tout l’écosystème de la propreté en France.',
};

export default function AProposPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">À propos de ClubProprete</h1>
      <div className="mt-6 space-y-4 text-body text-navy">
        <p>
          Le secteur de la propreté en France, c&apos;est plus de <strong>30 000 entreprises</strong>{' '}
          — et aucune plateforme centrale. Recruter, trouver un sous-traitant fiable, se former, se
          rendre visible : tout passe encore par le bouche-à-oreille.
        </p>
        <p>
          ClubProprete réunit tout l&apos;écosystème autour d&apos;un réseau professionnel vertical :
          profils publics, annuaire d&apos;entités vérifiées, média écrit par la communauté, offres
          d&apos;emploi et club associatif.
        </p>
        <p>
          La plateforme est <strong>entièrement gratuite</strong> : pas d&apos;abonnement, pas de
          fiche sponsorisée, pas de publicité. La visibilité se gagne par la qualité du profil, pas
          par le budget.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/signup" className="font-medium text-blue underline">
          Rejoindre le réseau →
        </Link>
      </p>
    </main>
  );
}
