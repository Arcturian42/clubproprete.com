import type { Metadata } from 'next';

/** Espace membre — noindex (Annexe C). Coquille sidebar persistante en MVP 1. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
