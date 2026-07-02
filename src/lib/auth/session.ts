import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

/** Utilisateur authentifié courant (validé auprès d'Auth), ou null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Exige une session — sinon redirige vers /login?next=... */
export async function requireUser(nextPath?: string) {
  const user = await getUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login');
  }
  return user;
}

/** Profil de l'utilisateur courant (créé par trigger au signup), ou null. */
export async function getCurrentProfile(): Promise<Tables<'profiles'> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  return data;
}
