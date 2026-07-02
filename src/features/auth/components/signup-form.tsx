'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signUp, type AuthFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {});

  if (state.success) {
    return <Alert variant="success">{state.success}</Alert>;
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" htmlFor="firstName" required error={state.fieldErrors?.firstName}>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            invalid={!!state.fieldErrors?.firstName}
          />
        </Field>
        <Field label="Nom" htmlFor="lastName" required error={state.fieldErrors?.lastName}>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            invalid={!!state.fieldErrors?.lastName}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={!!state.fieldErrors?.email}
        />
      </Field>

      <Field
        label="Mot de passe"
        htmlFor="password"
        required
        error={state.fieldErrors?.password}
        hint="8 caractères minimum."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          invalid={!!state.fieldErrors?.password}
        />
      </Field>

      <Button type="submit" loading={pending} className="w-full">
        Créer mon compte gratuit
      </Button>

      <p className="text-caption text-grey">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-blue underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
