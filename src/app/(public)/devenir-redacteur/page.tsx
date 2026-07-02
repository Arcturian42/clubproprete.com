import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = {
  title: 'Devenir rédacteur',
  description:
    'Partagez votre expertise : candidatez comme rédacteur et publiez sur le média de la propreté.',
};

export default function DevenirRedacteurPage() {
  return (
    <ComingSoon
      title="Devenir rédacteur"
      description="Tout membre peut candidater : une fois validé, vous écrivez des articles qui s'affichent sur votre profil, comme sur LinkedIn."
      mvp="MVP 2"
    />
  );
}
