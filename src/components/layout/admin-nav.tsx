'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Navigation back-office (PRD 9.3). */
const ITEMS = [
  { href: '/admin', label: "Vue d'ensemble", exact: true },
  { href: '/admin/utilisateurs', label: 'Utilisateurs & capacités' },
  { href: '/admin/entites', label: 'Entités' },
  { href: '/admin/demandes', label: 'Demandes' },
  { href: '/admin/moderation', label: 'Modération' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/ressources', label: 'Ressources' },
  { href: '/admin/audit', label: 'Audit' },
  { href: '/admin/parametres', label: 'Paramètres' },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Back-office" className="w-60 shrink-0 border-r border-grey/20 bg-navy py-4">
      <p className="mb-3 px-4 text-caption font-semibold uppercase tracking-wide text-white/60">
        Back-office
      </p>
      <ul className="space-y-0.5 px-2">
        {ITEMS.map(({ href, label, ...rest }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href, 'exact' in rest ? rest.exact : undefined) ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-sm px-3 py-2 text-body',
                isActive(href, 'exact' in rest ? rest.exact : undefined)
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
