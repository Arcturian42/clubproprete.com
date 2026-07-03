'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { applyToJob, type JobFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-10 — candidater à une offre (île client : /signup si anonyme). */
export function ApplyForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [state, action, pending] = useActionState<JobFormState, FormData>(applyToJob, {});

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setAuthed(Boolean(user)));
  }, []);

  if (state.success) return <Alert variant="success">{state.success}</Alert>;

  if (!authed) {
    return (
      <Button onClick={() => router.push(`/signup`)}>Se connecter pour postuler</Button>
    );
  }

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="jobId" value={jobId} />
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Message au recruteur (optionnel)" htmlFor="ap-msg">
        <Textarea id="ap-msg" name="message" rows={4} maxLength={2000} />
      </Field>
      <Field label="Lien vers votre CV (https, optionnel)" htmlFor="ap-cv">
        <Input id="ap-cv" name="cvUrl" type="url" placeholder="https://…" />
      </Field>
      <Button type="submit" loading={pending}>
        Envoyer ma candidature
      </Button>
    </form>
  );
}
