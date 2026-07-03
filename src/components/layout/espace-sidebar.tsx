'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Users,
  MessageSquare,
  Building2,
  PenSquare,
  Briefcase,
  FileText,
  Handshake,
  Settings,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar persistante de /espace (PRD 9.2). Desktop : latérale ;
 * mobile : bottom navigation 5 onglets (PRD 9.4).
 */
const ITEMS = [
  { href: '/espace/profil', label: 'Mon profil', icon: User, mobile: true },
  { href: '/espace/reseau', label: 'Mon réseau', icon: Users, mobile: true },
  { href: '/espace/messages', label: 'Messages', icon: MessageSquare, mobile: true },
  { href: '/espace/notifications', label: 'Notifications', icon: Bell, mobile: false },
  { href: '/espace/fiches', label: 'Mes fiches', icon: Building2, mobile: true },
  { href: '/espace/redaction', label: 'Espace rédaction', icon: PenSquare, mobile: false },
  { href: '/espace/offres', label: 'Mes offres', icon: Briefcase, mobile: false },
  { href: '/espace/candidatures', label: 'Mes candidatures', icon: FileText, mobile: false },
  { href: '/espace/sous-traitance', label: 'Sous-traitance', icon: Handshake, mobile: false },
  { href: '/espace/parametres', label: 'Paramètres', icon: Settings, mobile: true },
] as const;

export function EspaceSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop / tablette */}
      <nav
        aria-label="Espace membre"
        className="hidden w-56 shrink-0 border-r border-grey/20 bg-white py-4 md:block"
      >
        <ul className="space-y-0.5 px-2">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2.5 rounded-sm px-3 py-2 text-body',
                  isActive(href)
                    ? 'bg-bg-light font-medium text-blue'
                    : 'text-grey hover:bg-bg-light hover:text-navy',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile : bottom navigation 5 onglets */}
      <nav
        aria-label="Espace membre"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-grey/20 bg-white md:hidden"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.filter((i) => i.mobile).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]',
                  isActive(href) ? 'text-blue' : 'text-grey',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label.replace(/^(Mon |Mes |Espace )/, '')}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
