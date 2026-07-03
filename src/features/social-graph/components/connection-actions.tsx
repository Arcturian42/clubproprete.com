'use client';

import { acceptConnection, removeConnection } from '../actions';
import { Button } from '@/components/ui/button';

/** Boutons Accepter / Retirer pour une demande de connexion reçue. */
export function IncomingActions({ fromUserId }: { fromUserId: string }) {
  return (
    <div className="flex gap-2">
      <form action={acceptConnection}>
        <input type="hidden" name="fromUserId" value={fromUserId} />
        <Button type="submit" size="sm">Accepter</Button>
      </form>
      <form action={removeConnection}>
        <input type="hidden" name="otherId" value={fromUserId} />
        <Button type="submit" size="sm" variant="ghost">Ignorer</Button>
      </form>
    </div>
  );
}
