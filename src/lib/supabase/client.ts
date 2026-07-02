import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import type { Database } from '@/types/database.types';

/**
 * Client Supabase côté navigateur — réservé à l'INTERACTIF et au temps réel
 * (Supabase Realtime : messagerie, présence). Soumis à la RLS. Ne jamais
 * y faire de mutation métier sensible (celles-ci passent par Server Actions).
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
