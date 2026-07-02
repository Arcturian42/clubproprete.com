import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import type { Database } from '@/types/database.types';

/**
 * Client Supabase PUBLIC (anonyme, sans cookies) — réservé aux lectures des
 * pages publiques (profils, fiches, annuaire). Ne porte aucune session :
 * la RLS n'expose que le contenu public, et Next peut mettre la page en
 * cache/ISR (aucune lecture de cookies() qui forcerait le dynamique).
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
