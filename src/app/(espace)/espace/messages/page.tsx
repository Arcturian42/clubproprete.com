import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { getConversations } from '@/features/messaging/queries';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/states';
import { t } from '@/i18n/fr';

export const metadata: Metadata = { title: 'Messages' };

/** F-15 — liste des conversations. */
export default async function MessagesPage() {
  const user = await requireUser('/espace/messages');
  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-h2 font-bold text-navy">Messages</h1>

      {conversations.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={t('empty_messages')}
          action={
            <Link href="/annuaire/societes" className="font-medium text-blue underline">
              Explorer l&apos;annuaire
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
          {conversations.map((c) => {
            const name = `${c.other?.first_name ?? ''} ${c.other?.last_name ?? ''}`.trim() || 'Utilisateur supprimé';
            const unread = !c.lastReadAt || new Date(c.updatedAt) > new Date(c.lastReadAt);
            return (
              <li key={c.id}>
                <Link href={`/espace/messages/${c.id}`} className="flex items-center gap-3 p-3 hover:bg-ice">
                  <Avatar src={c.other?.photo_url} name={name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-body font-medium text-navy">
                      {name}
                      {unread && <span className="h-2 w-2 rounded-full bg-blue" aria-label="non lu" />}
                    </p>
                    <p className="truncate text-caption text-grey">{c.lastMessage ?? 'Nouvelle conversation'}</p>
                  </div>
                  <span className="shrink-0 text-caption text-grey">
                    {new Date(c.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
