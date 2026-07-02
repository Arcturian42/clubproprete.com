import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mentions légales' };

/**
 * Mentions légales (LCEN) — page complète exigée dès le lancement (PRD 21.5).
 * ⚠️ Les champs [À COMPLÉTER] doivent être renseignés avant l'ouverture publique.
 */
export default function MentionsLegalesPage() {
  return (
    <main className="prose mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Mentions légales</h1>

      <section className="mt-6 space-y-1 text-body text-navy">
        <h2 className="text-h3 font-semibold">Éditeur du site</h2>
        <p>
          ClubProprete.com — édité par <strong>[À COMPLÉTER : raison sociale]</strong>
          <br />
          Siège social : [À COMPLÉTER]
          <br />
          SIRET : [À COMPLÉTER] — Directeur de la publication : [À COMPLÉTER]
          <br />
          Contact : <a href="mailto:contact@clubproprete.com">contact@clubproprete.com</a>
        </p>
      </section>

      <section className="mt-6 space-y-1 text-body text-navy">
        <h2 className="text-h3 font-semibold">Hébergement</h2>
        <p>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
          <a href="https://vercel.com" className="text-blue underline">
            vercel.com
          </a>
          <br />
          Données hébergées par Supabase (région Union européenne).
        </p>
      </section>

      <section className="mt-6 space-y-1 text-body text-navy">
        <h2 className="text-h3 font-semibold">Fiches professionnelles tierces</h2>
        <p>
          Certaines fiches de l&apos;annuaire sont créées à partir de données publiques. Chaque
          fiche non revendiquée comporte un lien « Demander le retrait » permettant à son
          représentant légal d&apos;en demander la suppression ou la revendication.
        </p>
      </section>

      <section className="mt-6 space-y-1 text-body text-navy">
        <h2 className="text-h3 font-semibold">Propriété intellectuelle</h2>
        <p>
          Les contenus publiés par les membres restent leur propriété. Toute reproduction sans
          autorisation est interdite.
        </p>
      </section>
    </main>
  );
}
