'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { requestMembership } from '../actions';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

/** F-11 — bouton de candidature à l'adhésion (île client). */
export function MembershipButton() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setAuthed(false);
      setAuthed(true);
      const { data } = await supabase
        .from('association_memberships')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      setStatus(data?.status ?? null);
    });
  }, []);

  if (authed === false) {
    return <Button onClick={() => router.push('/signup')}>Se connecter pour candidater</Button>;
  }
  if (result?.success) return <Alert variant="success">{result.success}</Alert>;
  if (status === 'approved') return <Alert variant="success">Vous êtes membre de l&apos;association.</Alert>;
  if (status === 'pending') return <Alert variant="info">Votre candidature d&apos;adhésion est en cours d&apos;examen.</Alert>;

  return (
    <div className="space-y-2">
      {result?.error && <Alert variant="error">{result.error}</Alert>}
      <Button
        loading={pending}
        onClick={async () => {
          setPending(true);
          setResult(await requestMembership());
          setPending(false);
        }}
      >
        Candidater à l&apos;adhésion
      </Button>
    </div>
  );
}
