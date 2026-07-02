import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Formations — organismes du secteur propreté',
  description:
    'Centres et organismes de formation de la propreté : CQP, CACES, Qualiopi, SST. Annuaire gratuit.',
};

/** Page formations : renvoie vers l'annuaire des centres (M05). */
export default function FormationsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Se former aux métiers de la propreté</h1>
      <p className="mt-2 text-body text-grey">
        Retrouvez les centres et organismes de formation du secteur — certifications Qualiopi,
        CQP propreté, CACES, SST — dans l&apos;annuaire dédié.
      </p>
      <p className="mt-6">
        <Link href="/annuaire/centres-formation" className="font-medium text-blue underline">
          Voir l&apos;annuaire des centres de formation →
        </Link>
      </p>
    </main>
  );
}
