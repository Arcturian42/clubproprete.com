import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = {
  title: 'Blog — le média de la propreté',
  description:
    'Articles écrits par la communauté : réglementation, technique, gestion, emploi dans la propreté.',
};

export default function BlogPage() {
  return (
    <ComingSoon
      title="Le média de la propreté"
      description="Un blog à rédaction communautaire : tout professionnel peut candidater comme rédacteur et publier des articles rattachés à son profil."
      mvp="MVP 2"
    />
  );
}
