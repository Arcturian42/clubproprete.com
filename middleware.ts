import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  ROUTE_CAPABILITY_GUARDS,
  MODERATE_ADMIN_PREFIXES,
} from '@/config/routes';

/**
 * Middleware racine.
 * 1. Rafraîchit la session Supabase (rotation du refresh token).
 * 2. Garde d'authentification : /espace/* et /admin/* → 302 /login?next=... si anonyme.
 * 3. Garde de capacité : lit le claim JWT `capabilities` (aucun claim `role`).
 * 4. Redirige un utilisateur déjà connecté hors de /login,/signup,/reset.
 *
 * Note : le step-up super_admin (T12) et le contrôle fin par capacité sur les
 * mutations restent gardés côté RLS/Server Action (défense en profondeur).
 */
const PROTECTED_PREFIXES = ['/espace', '/admin'];
const AUTH_PAGES = ['/login', '/signup', '/reset'];

function getCapabilitiesFromToken(token: string | undefined): string[] {
  if (!token) return [];
  const parts = token.split('.');
  if (parts.length !== 3) return [];
  try {
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return Array.isArray(json.capabilities) ? json.capabilities : [];
  } catch {
    return [];
  }
}

export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  // 4. Déjà connecté sur une page d'auth → /espace
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/espace', request.url));
  }

  // 2. Route protégée sans session → /login?next=...
  if (isProtected && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 3. Garde de capacité (routing ; la RLS reste l'autorité en base)
  if (isProtected && user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const caps = getCapabilitiesFromToken(session?.access_token);

    for (const guard of ROUTE_CAPABILITY_GUARDS) {
      if (pathname.startsWith(guard.prefix) && !caps.includes(guard.capability)) {
        // /admin/* tolère `moderate` sur les files de modération
        const moderateOk =
          MODERATE_ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && caps.includes('moderate');
        if (!moderateOk) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf les assets statiques et les fichiers d'image
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
