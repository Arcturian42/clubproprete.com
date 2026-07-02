import type { Metadata } from 'next';
import { requireUser, getCurrentProfile } from '@/lib/auth/session';
import { OnboardingWizard } from '@/features/onboarding/components/wizard';

export const metadata: Metadata = { title: 'Bienvenue — configurez votre espace' };

/** F-01 — Onboarding par situation (après confirmation email). */
export default async function OnboardingPage() {
  await requireUser('/espace/onboarding');
  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h2 font-bold text-navy">Bienvenue sur ClubProprete</h1>
      <p className="mb-8 mt-1 text-body text-grey">
        Quatre étapes pour brancher votre espace à votre situation réelle.
      </p>
      <div className="rounded-lg border border-navy/10 bg-white p-6 shadow-lift">
        <OnboardingWizard
          defaultFirstName={profile?.first_name ?? ''}
          defaultLastName={profile?.last_name ?? ''}
        />
      </div>
    </div>
  );
}
