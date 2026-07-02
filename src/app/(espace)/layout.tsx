import type { Metadata } from 'next';
import Link from 'next/link';
import { EspaceSidebar } from '@/components/layout/espace-sidebar';

/**
 * Espace membre — noindex (Annexe C), coquille persistante (PRD 9.2) :
 * sidebar latérale (bottom nav 5 onglets en mobile), header sobre.
 * La garde d'authentification est portée par le middleware.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-light">
      <header className="flex h-14 items-center justify-between border-b border-grey/20 bg-white px-4">
        <Link href="/" className="text-body font-bold text-navy">
          Club<span className="text-blue">Proprete</span>
        </Link>
        <Link href="/espace/parametres" className="text-caption text-grey hover:text-navy">
          Mon compte
        </Link>
      </header>
      <div className="flex flex-1">
        <EspaceSidebar />
        <main className="flex-1 px-4 pb-20 pt-6 md:px-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
