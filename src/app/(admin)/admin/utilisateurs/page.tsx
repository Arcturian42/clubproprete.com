import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { grantCapability, revokeCapability } from '@/features/admin/actions';
import { CAPABILITIES } from '@/config/capabilities';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';

export const metadata: Metadata = { title: 'Utilisateurs & capacités — back-office' };

/**
 * Utilisateurs & capacités (M15) — pose/retrait par capacité (aucun rôle).
 * Liste keyset simple (50 derniers) ; recherche fine avec la montée en charge.
 */
export default async function UtilisateursPage() {
  await requireUser('/admin/utilisateurs');
  const supabase = await createClient();

  const [{ data: profiles }, { data: caps }] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, first_name, last_name, slug, main_role, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('user_capabilities').select('user_id, capability, revoked_at'),
  ]);

  const capsByUser = new Map<string, string[]>();
  for (const c of caps ?? []) {
    if (c.revoked_at) continue;
    const list = capsByUser.get(c.user_id) ?? [];
    list.push(c.capability);
    capsByUser.set(c.user_id, list);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-h2 font-bold text-navy">Utilisateurs &amp; capacités</h1>
      <p className="mt-1 text-body text-grey">
        L&apos;autorisation passe uniquement par les capacités — main_role n&apos;est
        qu&apos;une identité de routage.
      </p>

      {!profiles || profiles.length === 0 ? (
        <EmptyState className="mt-6" title="Aucun utilisateur." />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-navy/10 bg-white shadow-lift">
          <table className="w-full text-left text-body">
            <thead className="border-b border-navy/10 bg-ice text-caption uppercase tracking-wide text-grey">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">main_role</th>
                <th className="px-4 py-3">Capacités actives</th>
                <th className="px-4 py-3">Gérer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {profiles.map((p) => {
                const active = capsByUser.get(p.user_id) ?? [];
                return (
                  <tr key={p.user_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">
                        {`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.slug}
                      </p>
                      <p className="text-caption text-grey">/p/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.main_role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {active.length === 0 ? (
                        <span className="text-caption text-grey">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {active.map((c) => (
                            <Badge key={c}>{c}</Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {CAPABILITIES.map((c) => {
                          const has = active.includes(c);
                          return (
                            <form key={c} action={has ? revokeCapability : grantCapability}>
                              <input type="hidden" name="userId" value={p.user_id} />
                              <input type="hidden" name="capability" value={c} />
                              <button
                                type="submit"
                                title={has ? `Retirer ${c}` : `Poser ${c}`}
                                className={
                                  has
                                    ? 'rounded-full bg-blue px-2.5 py-1 text-[11px] font-medium text-white hover:bg-error'
                                    : 'rounded-full border border-navy/20 px-2.5 py-1 text-[11px] text-grey hover:border-blue hover:text-blue'
                                }
                              >
                                {c}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
