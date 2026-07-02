import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact' };

/** Contact institutionnel. Le contact d'une fiche (F-24) ouvre une conversation. */
export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-h1 font-bold text-navy">Contact</h1>
      <p className="mt-4 text-body text-navy">
        Pour contacter un professionnel de l&apos;annuaire, utilisez le bouton « Contacter » de sa
        fiche : cela ouvre une conversation directe sur la plateforme.
      </p>
      <p className="mt-2 text-body text-navy">
        Pour toute question sur la plateforme elle-même :{' '}
        <a href="mailto:contact@clubproprete.com" className="text-blue underline">
          contact@clubproprete.com
        </a>
      </p>
    </main>
  );
}
