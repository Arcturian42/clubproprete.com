/**
 * Configuration Supabase centralisée.
 * Si les variables d'env manquent (ex. premier build Vercel avant saisie des
 * clés), on retombe sur des placeholders : le build passe, les requêtes
 * échouent proprement au runtime et les écrans affichent leur état d'erreur
 * (4 états UI) au lieu de faire planter la compilation.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
