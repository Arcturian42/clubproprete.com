import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

/** RGPD (PRD 21bis) : finalités, droits, durées, sans cookies publicitaires. */
export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Politique de confidentialité</h1>

      <div className="mt-6 space-y-6 text-body text-navy">
        <section>
          <h2 className="text-h3 font-semibold">Données collectées</h2>
          <p className="mt-1 text-grey">
            Données de compte (email, nom), de profil professionnel (ville, compétences,
            expériences) et d&apos;entité (SIRET, services). Aucune donnée n&apos;est vendue ni
            transmise à des annonceurs — la plateforme est gratuite et sans publicité.
          </p>
        </section>
        <section>
          <h2 className="text-h3 font-semibold">Mesure d&apos;audience</h2>
          <p className="mt-1 text-grey">
            Analytics sans cookies (Plausible). Aucune bannière n&apos;est nécessaire ; aucun
            traceur publicitaire n&apos;est déposé.
          </p>
        </section>
        <section>
          <h2 className="text-h3 font-semibold">Vos droits</h2>
          <p className="mt-1 text-grey">
            Accès, rectification, portabilité (export JSON depuis vos paramètres), suppression du
            compte avec anonymisation des données personnelles. Demandes traitées sous 30 jours.
            Recours possible auprès de la CNIL.
          </p>
        </section>
        <section>
          <h2 className="text-h3 font-semibold">Conservation</h2>
          <p className="mt-1 text-grey">
            Compte actif : tant qu&apos;il existe. Après suppression : données personnelles
            anonymisées immédiatement, pièces jointes purgées sous 30 jours, journaux de sécurité
            conservés conformément à la loi.
          </p>
        </section>
        <section>
          <h2 className="text-h3 font-semibold">Contact</h2>
          <p className="mt-1 text-grey">
            Pour toute question :{' '}
            <a href="mailto:contact@clubproprete.com" className="text-blue underline">
              contact@clubproprete.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
