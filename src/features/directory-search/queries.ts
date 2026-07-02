import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';
import type { EntityType } from '@/referentiels';

/** Ligne renvoyée par la RPC search_directory (0003). */
export interface DirectoryRow {
  entity_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  city_name: string | null;
  department: string | null;
  region: string | null;
  verified: boolean;
  score: number;
}

export interface DirectoryFilters {
  type: EntityType;
  q?: string;
  service?: string;
  region?: string;
  verifiedOnly?: boolean;
  cursor?: string; // keyset encodé (score:id) en base64url
}

export interface DirectoryResult {
  rows: DirectoryRow[];
  nextCursor: string | null;
  error: boolean;
}

const PAGE_SIZE = 20;

function decodeCursor(cursor: string | undefined): { score: number; id: string } | null {
  if (!cursor) return null;
  try {
    const [score, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!score || !id) return null;
    return { score: Number(score), id };
  } catch {
    return null;
  }
}

function encodeCursor(row: DirectoryRow): string {
  return Buffer.from(`${row.score}|${row.entity_id}`, 'utf8').toString('base64url');
}

/** F-08 — annuaire : RPC keyset (jamais d'OFFSET), client public (cacheable). */
export async function searchDirectory(filters: DirectoryFilters): Promise<DirectoryResult> {
  const supabase = createPublicClient();
  const cursor = decodeCursor(filters.cursor);

  const { data, error } = await supabase.rpc('search_directory', {
    p_type: filters.type,
    p_service: filters.service ?? null,
    p_region: filters.region ?? null,
    p_verified: filters.verifiedOnly ?? false,
    p_q: filters.q ?? null,
    p_cursor_score: cursor?.score ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: PAGE_SIZE + 1, // +1 pour savoir s'il y a une page suivante
  } as never);

  if (error) {
    console.error('[directory] RPC search_directory', error.message);
    return { rows: [], nextCursor: null, error: true };
  }

  const all = (data ?? []) as DirectoryRow[];
  const rows = all.slice(0, PAGE_SIZE);
  const nextCursor = all.length > PAGE_SIZE ? encodeCursor(rows[rows.length - 1]!) : null;
  return { rows, nextCursor, error: false };
}
