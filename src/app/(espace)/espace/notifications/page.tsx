import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { getNotifications } from '@/features/notifications/queries';
import { markAllNotificationsRead } from '@/features/notifications/actions';
import { describeNotification } from '@/features/notifications/labels';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Notifications' };

/** Centre de notifications in-app (M14). */
export default async function NotificationsPage() {
  await requireUser('/espace/notifications');
  const notifications = await getNotifications();
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h2 font-bold text-navy">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm">
              Tout marquer comme lu
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Aucune notification."
          description="Vous serez prévenu ici des décisions, messages et interactions."
        />
      ) : (
        <ul className="mt-6 divide-y divide-navy/10 overflow-hidden rounded-lg border border-navy/10 bg-white">
          {notifications.map((n) => {
            const { title, href } = describeNotification(
              n.type,
              (n.payload ?? {}) as Record<string, unknown>,
            );
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-start gap-3 p-4 hover:bg-ice',
                    !n.read_at && 'bg-ice/60',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      n.read_at ? 'bg-bg-light text-grey' : 'bg-blue/10 text-blue',
                    )}
                  >
                    <Bell className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body text-navy">{title}</span>
                    <span className="text-caption text-grey">
                      {new Date(n.created_at).toLocaleString('fr-FR')}
                    </span>
                  </span>
                  {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue" aria-label="non lu" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
