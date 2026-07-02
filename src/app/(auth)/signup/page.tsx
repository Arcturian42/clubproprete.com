import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth/components/signup-form';

export const metadata: Metadata = { title: 'Créer un compte', robots: { index: false } };

/** F-01 étape 1 — Inscription email. */
export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-h3 font-bold text-navy">Créer un compte</h1>
      <p className="mb-4 text-caption text-grey">
        Gratuit, sans engagement — rejoignez le réseau de la propreté française.
      </p>
      <SignupForm />
    </>
  );
}
