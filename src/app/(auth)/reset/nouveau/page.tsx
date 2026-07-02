import type { Metadata } from 'next';
import { NewPasswordForm } from '@/features/auth/components/reset-form';

export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: { index: false } };

/** F-03 étape 3 — saisie du nouveau mot de passe (session issue du lien email). */
export default function NewPasswordPage() {
  return (
    <>
      <h1 className="mb-4 text-h3 font-bold text-navy">Nouveau mot de passe</h1>
      <NewPasswordForm />
    </>
  );
}
