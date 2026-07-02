import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };

/** F-02 — Connexion. `next` : deep-link de retour posé par le middleware. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-h3 font-bold text-navy">Connexion</h1>
      <LoginForm next={next} initialError={error} />
    </>
  );
}
