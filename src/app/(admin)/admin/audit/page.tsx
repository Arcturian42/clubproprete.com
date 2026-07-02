import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = { title: 'Audit — back-office' };

/** Journal d'audit (M17) — lecture admin_panel (RLS), table immuable. */
export default async function AuditPage() {
  await requireUser('/admin/audit');
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, target_type, target_id, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h2 font-bold text-navy">Journal d&apos;audit</h1>
      <p className="mt-1 text-body text-grey">
        Toute pose/retrait de capacité et transition d&apos;état est tracée ici (immuable).
      </p>

      {!logs || logs.length === 0 ? (
        <EmptyState className="mt-6" title="Aucune entrée d'audit." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-navy/10 bg-white shadow-lift">
          <table className="w-full text-left text-caption">
            <thead className="border-b border-navy/10 bg-ice uppercase tracking-wide text-grey">
              <tr>
                <th className="px-4 py-3">Quand</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5 font-mono">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-grey">
                    {new Date(l.created_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-2 font-medium text-navy">{l.action}</td>
                  <td className="px-4 py-2 text-grey">
                    {l.target_type}:{l.target_id?.slice(0, 8) ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-grey">{l.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
