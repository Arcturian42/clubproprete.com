'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, clientIp, RateLimitError } from '@/lib/rate-limit';
import { elevateSuperAdminIfNeeded, isSuperAdminEmail } from '@/lib/auth/super-admin';
import { audit } from '@/lib/audit';
import { t } from '@/i18n/fr';
import {
  loginSchema,
  signupSchema,
  resetRequestSchema,
  updatePasswordSchema,
} from './schemas';

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function zodFieldErrors(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** F-02 — Connexion : rate limit sur échecs, élévation super_admin, routing par capacité. */
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) {
    return { error: t('error_validation'), fieldErrors: zodFieldErrors(parsed.error) };
  }
  const { email, password, next } = parsed.data;
  const ip = await clientIp();

  // Verrou : 5 échecs / 15 min / email+IP — vérifié AVANT la tentative.
  try {
    await rateLimit('login_fail', `${email}:${ip}`);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: t('error_invalid_credentials') };
  }

  // Élévation super_admin idempotente (pose moderate + admin_panel).
  await elevateSuperAdminIfNeeded(data.user.id, data.user.email);

  // Les capacités viennent d'être posées : rafraîchir pour un JWT à jour.
  if (isSuperAdminEmail(data.user.email)) {
    await supabase.auth.refreshSession();
  }

  revalidatePath('/', 'layout');
  redirect(next ?? (isSuperAdminEmail(data.user.email) ? '/admin' : '/espace'));
}

/** F-01 étape 1 — Inscription (email). Le trigger crée le profil + slug. */
export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });
  if (!parsed.success) {
    return { error: t('error_validation'), fieldErrors: zodFieldErrors(parsed.error) };
  }
  const { email, password, firstName, lastName } = parsed.data;

  // 5 inscriptions / 1 h / IP.
  try {
    await rateLimit('signup', await clientIp());
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/espace/onboarding`,
      data: { first_name: firstName, last_name: lastName },
    },
  });

  if (error) {
    // Anti-énumération : Supabase renvoie un user « fantôme » pour un email
    // existant selon la config ; en cas d'erreur explicite, message dédié.
    if (error.message.toLowerCase().includes('already')) {
      return { error: t('error_email_taken') };
    }
    return { error: t('error_generic') };
  }

  // Complète le profil créé par trigger avec prénom/nom (session pas encore
  // active si confirmation email requise → best effort, refait à l'onboarding).
  if (data.user && data.session) {
    await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('user_id', data.user.id);
  }

  return { success: t('success_signup') };
}

/** F-03 — Demande de reset : réponse TOUJOURS neutre (anti-énumération). */
export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: t('error_validation'), fieldErrors: zodFieldErrors(parsed.error) };
  }
  const { email } = parsed.data;

  try {
    await rateLimit('password_reset', email);
  } catch (e) {
    // Même rate-limité, la réponse reste neutre (pas de fuite d'information).
    if (e instanceof RateLimitError) return { success: t('success_password_reset_sent') };
    throw e;
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset/nouveau`,
  });

  return { success: t('success_password_reset_sent') };
}

/** F-03 — Nouveau mot de passe (session issue du lien de reset). */
export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return { error: t('error_validation'), fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t('error_forbidden') };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: t('error_generic') };

  await audit({ actorId: user.id, action: 'password_updated', targetType: 'user', targetId: user.id });
  return { success: t('success_password_updated') };
}

/** F-02 — Déconnexion : invalide la session puis retour à l'accueil. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
