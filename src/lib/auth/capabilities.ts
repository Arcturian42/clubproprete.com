import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Capability } from '@/config/capabilities';

/**
 * Lecture applicative des capacités — MIROIR de la RLS Postgres `has_capability()`.
 * Source unique : le claim JWT `capabilities` (injecté par le custom_access_token_hook),
 * lu de façon identique par le module d'accès applicatif et par les RLS (§5.1, §13).
 *
 * ⚠️ Défense en profondeur : pour les actions sensibles, la RLS reste l'autorité
 * (la mutation échoue en base si la capacité manque). Ces helpers servent au
 * routing/UX et à un pré-contrôle explicite avant mutation.
 */

interface JwtPayload {
  capabilities?: string[];
  [key: string]: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as JwtPayload;
  } catch {
    return null;
  }
}

/** Retourne les capacités de la session courante (array du claim JWT). */
export async function getCapabilities(): Promise<Capability[]> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return [];
  const payload = decodeJwt(session.access_token);
  return (payload?.capabilities ?? []) as Capability[];
}

/** L'utilisateur courant détient-il la capacité ? (miroir de has_capability). */
export async function hasCapability(cap: Capability): Promise<boolean> {
  const caps = await getCapabilities();
  return caps.includes(cap);
}

/** Lève si la capacité est absente — à appeler en garde de Server Action. */
export async function requireCapability(cap: Capability): Promise<void> {
  if (!(await hasCapability(cap))) {
    throw new Error(`FORBIDDEN: capacité requise « ${cap} » absente.`);
  }
}
