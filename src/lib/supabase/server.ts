import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Client Supabase côté serveur (RSC, Server Actions, Route Handlers).
 * Porte la session de l'utilisateur → toutes les requêtes passent par la RLS.
 * C'est le client PAR DÉFAUT pour tout accès aux données (cf. §19.1).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll appelé depuis un RSC : ignoré (la session est rafraîchie par le middleware).
          }
        },
      },
    },
  );
}
