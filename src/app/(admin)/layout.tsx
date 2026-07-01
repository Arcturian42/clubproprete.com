import type { Metadata } from 'next';

/**
 * Back-office — noindex, capacité admin_panel (moderate sur les files).
 * La garde est appliquée par le middleware ; la RLS reste l'autorité en base.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
