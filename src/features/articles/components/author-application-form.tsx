'use client';

import { useActionState } from 'react';
import { applyAsAuthor, type ArticleFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-12 — candidature rédacteur. */
export function AuthorApplicationForm() {
  const [state, action, pending] = useActionState<ArticleFormState, FormData>(applyAsAuthor, {});

  if (state.success) return <Alert variant="success">{state.success}</Alert>;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Votre domaine d'expertise" htmlFor="aa-exp" required error={state.fieldErrors?.expertise}>
        <Input id="aa-exp" name="expertise" placeholder="Ex. : réglementation, techniques de vitrerie…" />
      </Field>
      <Field label="Votre motivation" htmlFor="aa-mot" required error={state.fieldErrors?.motivation}>
        <Textarea id="aa-mot" name="motivation" rows={5} placeholder="Ce que vous aimeriez partager avec la communauté." />
      </Field>
      <Button type="submit" loading={pending}>
        Envoyer ma candidature
      </Button>
    </form>
  );
}
