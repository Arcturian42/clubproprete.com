import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = {
  title: 'Ressources — modèles et checklists gratuits',
  description:
    'Modèles de documents, checklists et guides pratiques pour les professionnels de la propreté.',
};

export default function RessourcesPage() {
  return (
    <ComingSoon
      title="Ressources téléchargeables"
      description="Modèles de contrats, checklists qualité, grilles tarifaires : des documents pratiques et gratuits, contre un simple email."
      mvp="MVP 2"
    />
  );
}
