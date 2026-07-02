import Link from 'next/link';

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Plateforme',
    links: [
      { href: '/annuaire/societes', label: 'Sociétés de nettoyage' },
      { href: '/annuaire/fournisseurs', label: 'Fournisseurs' },
      { href: '/annuaire/centres-formation', label: 'Centres de formation' },
      { href: '/annuaire/independants', label: 'Indépendants' },
    ],
  },
  {
    title: 'Communauté',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/emploi', label: 'Emploi' },
      { href: '/association', label: 'Association' },
      { href: '/devenir-redacteur', label: 'Devenir rédacteur' },
    ],
  },
  {
    title: 'À propos',
    links: [
      { href: '/a-propos', label: 'Qui sommes-nous' },
      { href: '/contact', label: 'Contact' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/confidentialite', label: 'Confidentialité' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-grey/20 bg-bg-light">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-h4 font-bold text-navy">
            Club<span className="text-blue">Proprete</span>
          </p>
          <p className="mt-2 max-w-xs text-caption text-grey">
            Le réseau professionnel de toute la propreté française. Entièrement gratuit.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-grey">
              {col.title}
            </p>
            <ul className="space-y-1.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-caption text-navy hover:text-blue">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-grey/20 py-4 text-center text-caption text-grey">
        © {new Date().getFullYear()} ClubProprete.com — plateforme 100 % gratuite, sans publicité.
      </div>
    </footer>
  );
}
