'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signIn, type AuthFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Alert } from '@/components/ui/alert';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {initialError && !state.error && (
        <Alert variant="error">La connexion a échoué. Réessayez.</Alert>
      )}
      {state.error && <Alert variant="error">{state.error}</Alert>}

      {next && <input type="hidden" name="next" value={next} />}

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

      <Field label="Mot de passe" htmlFor="password" required error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={!!state.fieldErrors?.password}
        />
      </Field>

      <Button type="submit" loading={pending} className="w-full">
        Se connecter
      </Button>

      <div className="flex items-center justify-between text-caption">
        <Link href="/reset" className="text-blue underline">
          Mot de passe oublié ?
        </Link>
        <Link href="/signup" className="text-blue underline">
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
