import Link from 'next/link';
import { HeaderAuth } from './header-auth';

const NAV = [
  { href: '/annuaire/societes', label: 'Annuaire' },
  { href: '/blog', label: 'Blog' },
  { href: '/emploi', label: 'Emploi' },
  { href: '/formations', label: 'Formations' },
  { href: '/association', label: 'Association' },
  { href: '/ressources', label: 'Ressources' },
];

/**
 * Header public — sticky, verre dépoli au-dessus du contenu (fallback opaque
 * géré par .glass). 100 % statique côté serveur : l'état de session est résolu
 * côté client par <HeaderAuth/> pour préserver SSG/ISR.
 */
export function PublicHeader() {
  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-h4 font-bold tracking-tight text-navy">
          Club<span className="text-blue">Proprete</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 text-body text-grey transition-colors hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
