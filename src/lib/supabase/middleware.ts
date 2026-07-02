import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config';
import type { Database } from '@/types/database.types';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Rafraîchit la session Supabase à chaque requête et renvoie l'utilisateur.
 * Appelé depuis le middleware racine (middleware.ts). Ne PAS insérer de logique
 * entre createServerClient et getUser (recommandation Supabase SSR).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Env Supabase absente (ex. premier déploiement avant saisie des clés) :
  // pas d'appel réseau, tout le monde est anonyme — le site public fonctionne.
  if (!isSupabaseConfigured) {
    return { response, supabase: null, user: null };
  }

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
