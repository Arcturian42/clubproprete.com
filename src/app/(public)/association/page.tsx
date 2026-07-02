import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = {
  title: "L'association — le club de confiance de la propreté",
  description:
    'Adhésion gratuite sur candidature validée : badge membre, espace privé, sous-traitance entre membres.',
};

export default function AssociationPage() {
  return (
    <ComingSoon
      title="Le club associatif"
      description="Une adhésion gratuite, sur candidature validée : badge de membre, accès à l'espace privé et aux missions de sous-traitance réservées."
      mvp="MVP 4"
    />
  );
}
