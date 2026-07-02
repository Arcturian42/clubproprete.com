import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = {
  title: 'Emploi — offres du secteur de la propreté',
  description:
    "Offres d'emploi de la propreté en France : agents, chefs d'équipe, encadrement. Candidature directe et alertes.",
};

export default function EmploiPage() {
  return (
    <ComingSoon
      title="L'emploi de la propreté"
      description="Offres publiées par des entreprises vérifiées, candidature en deux clics, alertes par zone et type de contrat."
      mvp="MVP 4"
    />
  );
}
