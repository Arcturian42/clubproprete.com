'use client';

import { useActionState } from 'react';
import { requestPasswordReset, updatePassword, type AuthFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

/** F-03 étape 1 : demande (réponse toujours neutre). */
export function ResetRequestForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.success) {
    return <Alert variant="success">{state.success}</Alert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Envoyer le lien de réinitialisation
      </Button>
    </form>
  );
}

/** F-03 étape 3 : nouveau mot de passe (session issue du lien). */
export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(updatePassword, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.success && <Alert variant="success">{state.success}</Alert>}
      {state.error && <Alert variant="error">{state.error}</Alert>}
      <Field
        label="Nouveau mot de passe"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
        hint="8 caractères minimum."
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Mettre à jour
      </Button>
    </form>
  );
}
