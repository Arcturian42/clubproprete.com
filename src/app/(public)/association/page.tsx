import type { Metadata } from 'next';
import { Handshake, ShieldCheck, Users } from 'lucide-react';
import { MembershipButton } from '@/features/association/components/membership-button';

export const metadata: Metadata = {
  title: "L'association — le club de confiance de la propreté",
  description:
    'Adhésion gratuite sur candidature validée : badge membre, espace privé, sous-traitance entre membres.',
  alternates: { canonical: '/association' },
};

/** M11 — page association + candidature d'adhésion (F-11). */
export default function AssociationPage() {
  const benefits = [
    { icon: ShieldCheck, title: 'Un cercle de confiance', desc: 'Des membres validés un à un — vous savez à qui vous avez affaire.' },
    { icon: Handshake, title: 'Sous-traitance réservée', desc: 'Publiez et candidatez à des missions entre membres uniquement.' },
    { icon: Users, title: 'Badge & visibilité', desc: 'Un badge « Membre » qui rassure vos prospects et partenaires.' },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Le club associatif</h1>
      <p className="mt-2 text-body text-grey">
        Une adhésion <strong>gratuite</strong>, sur candidature validée. Elle débloque l&apos;espace
        privé et les missions de sous-traitance réservées aux membres.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {benefits.map((b) => (
          <div key={b.title} className="rounded-lg border border-navy/10 bg-white p-5 shadow-lift">
            <b.icon className="h-6 w-6 text-blue" aria-hidden />
            <h2 className="mt-3 text-h4 font-semibold text-navy">{b.title}</h2>
            <p className="mt-1 text-caption text-grey">{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-navy/10 bg-ice p-6">
        <h2 className="text-h4 font-semibold text-navy">Rejoindre l&apos;association</h2>
        <p className="mb-4 mt-1 text-body text-grey">
          Votre candidature est examinée par l&apos;équipe. Une fois validée, vous accédez
          immédiatement à la sous-traitance.
        </p>
        <MembershipButton />
      </div>
    </main>
  );
}
