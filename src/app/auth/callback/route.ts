import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { elevateSuperAdminIfNeeded } from '@/lib/auth/super-admin';

/**
 * Callback d'authentification — confirmation email, magic link, OAuth, reset.
 * Deux formats selon le flux Supabase :
 *  - `?code=...` (PKCE / OAuth) → exchangeCodeForSession
 *  - `?token_hash=...&type=...` (liens email OTP) → verifyOtp
 * Puis redirection vers `next` (validé : chemin relatif uniquement).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const rawNext = searchParams.get('next') ?? '/espace';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/espace';

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // Élévation super_admin au premier login confirmé également.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await elevateSuperAdminIfNeeded(user.id, user.email);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
