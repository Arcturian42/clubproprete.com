import 'server-only';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { t } from '@/i18n/fr';

/**
 * Rate limiting via Postgres `rate_limits` (fenêtre glissante simplifiée par
 * fenêtre fixe, PRD 19.2) — aucune dépendance externe au lancement ; bascule
 * Upstash différée à la montée en charge.
 *
 * Table service-role : key (pk) / window_start / count.
 * Politique en cas d'indisponibilité de la base : fail-open (on laisse passer)
 * pour ne pas transformer un incident infra en déni de service global —
 * l'action reste protégée par Auth + RLS.
 */

/** Limites du PRD 19.2 (action → {limit, windowSeconds}). */
export const RATE_LIMITS = {
  signup: { limit: 5, window: 3600 }, // 5 / 1 h / IP
  login_fail: { limit: 5, window: 900 }, // 5 échecs / 15 min / email+IP
  password_reset: { limit: 3, window: 3600 }, // 3 / 1 h / email
  author_application: { limit: 3, window: 604800 }, // 1 active + 2 / 7 j / user
  messages: { limit: 30, window: 60 },
  new_conversations: { limit: 20, window: 86400 },
  connections: { limit: 50, window: 86400 },
  reports: { limit: 20, window: 86400 },
  removal_request: { limit: 5, window: 86400 },
  contact: { limit: 10, window: 86400 },
  search_anon: { limit: 120, window: 60 },
  gdpr_export: { limit: 2, window: 86400 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(
      t('error_rate_limited', {
        delay:
          retryAfterSeconds >= 120
            ? `${Math.ceil(retryAfterSeconds / 60)} minutes`
            : `${retryAfterSeconds} secondes`,
      }),
    );
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** IP du client (Vercel/proxy : x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

/**
 * Consomme une unité pour (action, scope). Lève RateLimitError si dépassé.
 * scope = IP, email, user_id… selon la portée du PRD.
 */
export async function rateLimit(action: RateLimitAction, scope: string): Promise<void> {
  const { limit, window } = RATE_LIMITS[action];
  const key = `${action}:${scope}`;
  const now = Date.now();

  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('rate_limits')
      .select('window_start, count')
      .eq('key', key)
      .maybeSingle();

    const windowStartMs = row ? new Date(row.window_start).getTime() : 0;
    const expired = !row || now - windowStartMs >= window * 1000;

    if (expired) {
      await admin
        .from('rate_limits')
        .upsert({ key, window_start: new Date(now).toISOString(), count: 1 });
      return;
    }

    if (row.count >= limit) {
      const retryAfter = Math.ceil((windowStartMs + window * 1000 - now) / 1000);
      throw new RateLimitError(Math.max(retryAfter, 1));
    }

    await admin
      .from('rate_limits')
      .update({ count: row.count + 1 })
      .eq('key', key);
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
    // Fail-open : base indisponible → on journalise et on laisse passer.
    console.error('[rate-limit] indisponible, fail-open', e);
  }
}
