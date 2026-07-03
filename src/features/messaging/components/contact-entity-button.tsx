'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { contactEntity } from '../actions';
import { Button } from '@/components/ui/button';

/**
 * F-24 — bouton « Contacter » d'une fiche. Île client pour préserver l'ISR :
 * anonyme → /signup ; connecté → ouvre une conversation avec l'owner.
 */
export function ContactEntityButton({ entityId }: { entityId: string }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setAuthed(Boolean(user)));
  }, []);

  if (!authed) {
    return (
      <Button size="sm" onClick={() => router.push('/signup')}>
        <MessageSquare className="h-4 w-4" aria-hidden /> Contacter
      </Button>
    );
  }

  return (
    <form action={contactEntity}>
      <input type="hidden" name="entityId" value={entityId} />
      <Button type="submit" size="sm">
        <MessageSquare className="h-4 w-4" aria-hidden /> Contacter
      </Button>
    </form>
  );
}
