import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { getNetwork, type ProfileMini } from '@/features/social-graph/queries';
import { removeConnection } from '@/features/social-graph/actions';
import { IncomingActions } from '@/features/social-graph/components/connection-actions';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Mon réseau' };

function ProfileRow({ p, action }: { p: ProfileMini; action?: React.ReactNode }) {
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.slug;
  return (
    <li className="flex items-center gap-3 p-3">
      <Avatar src={p.photo_url} name={name} size={40} />
      <div className="min-w-0 flex-1">
        <Link href={`/p/${p.slug}`} className="text-body font-medium text-navy hover:text-blue">
          {name}
        </Link>
        {p.headline && <p className="truncate text-caption text-grey">{p.headline}</p>}
      </div>
      {action}
    </li>
  );
}

/** F-09 — mon réseau : demandes reçues, connexions, demandes envoyées. */
export default async function ReseauPage() {
  const user = await requireUser('/espace/reseau');
  const { incoming, connections, pendingOut } = await getNetwork(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-h2 font-bold text-navy">Mon réseau</h1>

      <section aria-labelledby="incoming">
        <h2 id="incoming" className="mb-2 text-h4 font-semibold text-navy">
          Demandes reçues <span className="text-caption font-normal text-grey">({incoming.length})</span>
        </h2>
        {incoming.length === 0 ? (
          <EmptyState title="Aucune demande en attente." />
        ) : (
          <ul className="divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
            {incoming.map((p) => (
              <ProfileRow key={p.user_id} p={p} action={<IncomingActions fromUserId={p.user_id} />} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="connections">
        <h2 id="connections" className="mb-2 text-h4 font-semibold text-navy">
          Mes connexions <span className="text-caption font-normal text-grey">({connections.length})</span>
        </h2>
        {connections.length === 0 ? (
          <EmptyState
            title="Vous n'avez pas encore de connexion."
            description="Explorez l'annuaire et connectez-vous à des professionnels."
          />
        ) : (
          <ul className="divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
            {connections.map((p) => (
              <ProfileRow
                key={p.user_id}
                p={p}
                action={
                  <div className="flex gap-2">
                    <Link
                      href={`/espace/messages`}
                      className="min-h-11 rounded-sm px-3 py-2 text-caption font-medium text-blue hover:bg-ice"
                    >
                      Message
                    </Link>
                    <form action={removeConnection}>
                      <input type="hidden" name="otherId" value={p.user_id} />
                      <Button type="submit" size="sm" variant="ghost">Retirer</Button>
                    </form>
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </section>

      {pendingOut.length > 0 && (
        <section aria-labelledby="pending">
          <h2 id="pending" className="mb-2 text-h4 font-semibold text-navy">
            Demandes envoyées <span className="text-caption font-normal text-grey">({pendingOut.length})</span>
          </h2>
          <ul className="divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
            {pendingOut.map((p) => (
              <ProfileRow key={p.user_id} p={p} action={<span className="text-caption text-grey">En attente</span>} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
