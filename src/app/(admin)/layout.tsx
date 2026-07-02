import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminNav } from '@/components/layout/admin-nav';

/**
 * Back-office — noindex, capacité admin_panel (moderate sur les files).
 * Garde appliquée par le middleware ; la RLS reste l'autorité en base.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-grey/20 bg-navy px-4">
        <Link href="/admin" className="text-body font-bold text-white">
          ClubProprete <span className="font-normal text-white/60">/ admin</span>
        </Link>
        <Link href="/espace" className="text-caption text-white/70 hover:text-white">
          ← Retour à l&apos;espace
        </Link>
      </header>
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 bg-bg-light px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
