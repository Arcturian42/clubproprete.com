'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * CTA d'authentification du header public — état résolu CÔTÉ CLIENT pour que
 * les pages publiques restent statiques/ISR (PRD 20 : SSG/ISR sur le public).
 * Rendu par défaut (anonyme) identique au SSR → pas de layout shift notable.
 */
export function HeaderAuth() {
  const [state, setState] = useState<'loading' | 'anon' | 'authed'>('loading');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session ? 'authed' : 'anon');
    });
  }, []);

  if (state === 'authed') {
    return (
      <Link href="/espace" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
        Mon espace
      </Link>
    );
  }

  // anon + loading : CTA par défaut (stable, pas de flash)
  return (
    <>
      <Link href="/login" className="hidden py-2 text-body text-grey hover:text-navy sm:block">
        Se connecter
      </Link>
      <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
        Créer un compte
      </Link>
    </>
  );
}
