import type { Metadata } from 'next';
import Link from 'next/link';
import { getUser } from '@/lib/auth/session';
import { AuthorApplicationForm } from '@/features/articles/components/author-application-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Devenir rédacteur',
  description:
    'Partagez votre expertise : candidatez comme rédacteur et publiez sur le média de la propreté.',
};

/** F-12 — page de candidature rédacteur (formulaire si connecté). */
export default async function DevenirRedacteurPage() {
  const user = await getUser();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Devenir rédacteur</h1>
      <p className="mt-2 text-body text-grey">
        Le média de ClubProprete est écrit par la communauté. Partagez votre expertise : une fois
        votre candidature validée, vous écrivez des articles qui s&apos;affichent aussi sur votre
        profil.
      </p>

      <div className="mt-8 rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        {user ? (
          <AuthorApplicationForm />
        ) : (
          <div className="text-center">
            <p className="text-body text-navy">Connectez-vous pour candidater.</p>
            <Link
              href="/login?next=/devenir-redacteur"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4 inline-flex')}
            >
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
