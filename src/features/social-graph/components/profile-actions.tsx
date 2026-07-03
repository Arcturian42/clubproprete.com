'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, UserCheck, MessageSquare, Star, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendConnectionRequest, toggleFollow } from '../actions';
import { contactUser } from '@/features/messaging/actions';
import { Button } from '@/components/ui/button';
import { RecommendForm } from './recommend-form';

type Rel = {
  connectionStatus: string | null;
  connectionInitiatedByMe: boolean;
  isFollowing: boolean;
};

/**
 * CTA du profil public — île client pour préserver l'ISR de la page.
 * Anonyme → boutons vers /signup ; connecté → actions réelles.
 */
export function ProfileActions({ targetUserId, targetName }: { targetUserId: string; targetName: string }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'anon' | 'self' | 'ready'>('loading');
  const [rel, setRel] = useState<Rel | null>(null);
  const [busy, setBusy] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setState('anon');
      if (user.id === targetUserId) return setState('self');
      const [{ data: conn }, { data: follow }] = await Promise.all([
        supabase
          .from('connections')
          .select('status, from_user_id')
          .or(
            `and(from_user_id.eq.${user.id},to_user_id.eq.${targetUserId}),and(from_user_id.eq.${targetUserId},to_user_id.eq.${user.id})`,
          )
          .maybeSingle(),
        supabase.from('follows').select('id').eq('from_user_id', user.id).eq('to_user_id', targetUserId).maybeSingle(),
      ]);
      setRel({
        connectionStatus: conn?.status ?? null,
        connectionInitiatedByMe: conn?.from_user_id === user.id,
        isFollowing: Boolean(follow),
      });
      setState('ready');
    });
  }, [targetUserId]);

  if (state === 'self') {
    return (
      <Button variant="secondary" size="sm" onClick={() => router.push('/espace/profil')}>
        Modifier mon profil
      </Button>
    );
  }

  if (state === 'loading' || state === 'anon') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => router.push('/signup')}>
          <UserPlus className="h-4 w-4" aria-hidden /> Se connecter
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.push('/signup')}>
          <MessageSquare className="h-4 w-4" aria-hidden /> Message
        </Button>
      </div>
    );
  }

  async function onConnect() {
    setBusy(true);
    const fd = new FormData();
    fd.set('toUserId', targetUserId);
    await sendConnectionRequest(fd);
    setRel((r) => (r ? { ...r, connectionStatus: 'pending', connectionInitiatedByMe: true } : r));
    setBusy(false);
  }
  async function onFollow() {
    setBusy(true);
    const fd = new FormData();
    fd.set('toUserId', targetUserId);
    fd.set('following', rel?.isFollowing ? '1' : '0');
    await toggleFollow(fd);
    setRel((r) => (r ? { ...r, isFollowing: !r.isFollowing } : r));
    setBusy(false);
  }
  async function onMessage() {
    setBusy(true);
    const fd = new FormData();
    fd.set('targetUserId', targetUserId);
    await contactUser(fd); // redirige vers le fil
  }

  const connected = rel?.connectionStatus === 'accepted';
  const pending = rel?.connectionStatus === 'pending';

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {connected ? (
          <Button size="sm" variant="secondary" disabled>
            <UserCheck className="h-4 w-4" aria-hidden /> Connecté
          </Button>
        ) : pending ? (
          <Button size="sm" variant="secondary" disabled>
            <Clock className="h-4 w-4" aria-hidden /> {rel?.connectionInitiatedByMe ? 'En attente' : 'Demande reçue'}
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect} loading={busy}>
            <UserPlus className="h-4 w-4" aria-hidden /> Se connecter
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onFollow} loading={busy}>
          {rel?.isFollowing ? 'Suivi' : 'Suivre'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onMessage} loading={busy}>
          <MessageSquare className="h-4 w-4" aria-hidden /> Message
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setRecOpen((v) => !v)}>
          <Star className="h-4 w-4" aria-hidden /> Recommander
        </Button>
      </div>
      {recOpen && <RecommendForm targetUserId={targetUserId} targetName={targetName} onDone={() => setRecOpen(false)} />}
    </div>
  );
}
