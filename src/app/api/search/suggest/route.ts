import { NextResponse, type NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';

/**
 * Autocomplétion de la recherche globale (F-08/M16) — RPC search_suggest
 * (pg_trgm), débouncée côté client, rate-limitée serveur : 120/min/IP (19.2).
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  try {
    await rateLimit('search_anon', ip);
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: e.message },
        { status: 429, headers: { 'Retry-After': String(e.retryAfterSeconds) } },
      );
    }
    throw e;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('search_suggest', {
    p_q: q,
    p_limit: 8,
  } as never);

  if (error) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
  return NextResponse.json(
    { suggestions: data ?? [] },
    { headers: { 'Cache-Control': 'public, max-age=30' } },
  );
}
