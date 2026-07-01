/**
 * Types de base de données générés par Supabase.
 *
 * ⚠️ PLACEHOLDER — à régénérer après exécution des migrations sur le projet lié :
 *   pnpm db:types   (supabase gen types typescript --linked > src/types/database.types.ts)
 *
 * Tant que les migrations n'ont pas tourné (Phase 0), ce type reste permissif.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
