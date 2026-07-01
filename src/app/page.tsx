/**
 * Accueil (placeholder Phase 0). L'implémentation réelle (recherche + preuve
 * sociale + schema.org FAQPage/Organization/WebSite) relève de MVP 1.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="rounded-full bg-bg-light px-3 py-1 text-caption font-medium text-teal">
        Phase 0 — socle en place
      </span>
      <h1 className="text-h1 font-bold text-navy">ClubProprete.com</h1>
      <p className="max-w-xl text-body text-grey">
        Le réseau professionnel de toute la propreté française : un profil qui vous rend visible, un
        réseau qui vous fait travailler, un média que vous écrivez — gratuitement.
      </p>
    </main>
  );
}
