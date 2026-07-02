import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

/** Vue d'ensemble (M15/M17) — KPI de pilotage MVP 1. */
export default async function AdminPage() {
  await requireUser('/admin');
  const supabase = await createClient();

  const [profiles, entities, verified, pendingVerifs] = await Promise.all([
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
    supabase.from('entities').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('entities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('verified', true),
    supabase
      .from('verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const kpis = [
    { label: 'Profils', value: profiles.count ?? '—', href: '/admin/utilisateurs' },
    { label: 'Entités actives', value: entities.count ?? '—', href: '/admin/entites' },
    { label: 'Fiches vérifiées', value: verified.count ?? '—', href: '/admin/entites' },
    { label: 'Vérifs en attente', value: pendingVerifs.count ?? '—', href: '/admin/demandes' },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-h2 font-bold text-navy">Vue d&apos;ensemble</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="transition-shadow hover:shadow-lift-lg">
              <p className="text-caption text-grey">{k.label}</p>
              <p className="mt-1 text-h1 font-bold text-navy">{k.value}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-caption text-grey">
        Objectif d&apos;amorçage MVP 1 : 200 profils · 80 fiches · 50 vérifiées (seed).
      </p>
    </div>
  );
}
