import type { Metadata } from 'next';
import { ResetRequestForm } from '@/features/auth/components/reset-form';

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false } };

/** F-03 — Demande de réinitialisation (réponse neutre anti-énumération). */
export default function ResetPage() {
  return (
    <>
      <h1 className="mb-4 text-h3 font-bold text-navy">Mot de passe oublié</h1>
      <ResetRequestForm />
    </>
  );
}
