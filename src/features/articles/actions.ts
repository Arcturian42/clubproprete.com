'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { requireCapability } from '@/lib/auth/capabilities';
import { audit } from '@/lib/audit';
import { notify, notifyCapabilityHolders } from '@/lib/notifications/notify';
import { markdownToSafeHtml, htmlToExcerpt } from '@/lib/sanitize/html';
import { hitsBlacklist } from '@/features/moderation/blacklist';
import { slugWithSuffix } from '@/lib/slug';
import { rateLimit, RateLimitError } from '@/lib/rate-limit';
import { t } from '@/i18n/fr';
import { authorApplicationSchema, articleDraftSchema } from './schemas';

export type ArticleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function fieldErrs(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** F-12 — candidater rédacteur (1 active + 2 / 7 j / user). */
export async function applyAsAuthor(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const user = await requireUser('/devenir-redacteur');
  const parsed = authorApplicationSchema.safeParse({
    expertise: formData.get('expertise'),
    motivation: formData.get('motivation'),
  });
  if (!parsed.success) return { error: t('error_validation'), fieldErrors: fieldErrs(parsed.error) };

  try {
    await rateLimit('author_application', user.id);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('author_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing) return { error: 'Vous avez déjà une candidature en cours.' };

  const { error } = await supabase.from('author_applications').insert({
    user_id: user.id,
    expertise: parsed.data.expertise,
    motivation: parsed.data.motivation,
    status: 'pending',
  });
  if (error) return { error: t('error_generic') };

  await audit({ actorId: user.id, action: 'author_application', targetType: 'user', targetId: user.id });
  await notifyCapabilityHolders({ capability: 'moderate', type: 'admin_queue', payload: { kind: 'author' } });
  return { success: 'Candidature envoyée. Vous serez notifié de la décision.' };
}

/** F-13 — sauvegarde d'un brouillon (RLS articles_insert : write_article + own). */
export async function saveArticleDraft(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const user = await requireUser('/espace/redaction');
  await requireCapability('write_article');

  const parsed = articleDraftSchema.safeParse({
    id: (formData.get('id') as string) || undefined,
    title: formData.get('title'),
    contentMarkdown: formData.get('contentMarkdown'),
    categoryId: (formData.get('categoryId') as string) || undefined,
    featuredImage: (formData.get('featuredImage') as string) || undefined,
  });
  if (!parsed.success) return { error: t('error_validation'), fieldErrors: fieldErrs(parsed.error) };
  const input = parsed.data;

  const safeHtml = markdownToSafeHtml(input.contentMarkdown);
  const excerpt = htmlToExcerpt(safeHtml);
  const supabase = await createClient();

  if (input.id) {
    // Édition d'un brouillon/rejeté existant (RLS articles_update).
    const { error } = await supabase
      .from('articles')
      .update({
        title: input.title,
        content: safeHtml,
        excerpt,
        category_id: input.categoryId ?? null,
        featured_image: input.featuredImage ?? null,
      })
      .eq('id', input.id)
      .eq('author_id', user.id);
    if (error) return { error: t('error_forbidden') };
    revalidatePath(`/espace/redaction/${input.id}`);
    return { success: 'Brouillon enregistré.' };
  }

  const { data, error } = await supabase
    .from('articles')
    .insert({
      author_id: user.id,
      title: input.title,
      slug: slugWithSuffix(input.title),
      content: safeHtml,
      excerpt,
      category_id: input.categoryId ?? null,
      featured_image: input.featuredImage ?? null,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error || !data) return { error: t('error_generic') };

  redirect(`/espace/redaction/${data.id}?saved=1`);
}

/** F-13 — soumettre à relecture (image requise → passe pending, ou auto-flag liste noire). */
export async function submitArticle(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/redaction');
  await requireCapability('write_article');
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/espace/redaction');

  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('id, title, content, featured_image, status')
    .eq('id', id)
    .eq('author_id', user.id)
    .maybeSingle();
  if (!article) redirect('/espace/redaction');
  if (!article.featured_image) {
    redirect(`/espace/redaction/${id}?error=image`);
  }

  const flagged = hitsBlacklist(`${article.title} ${article.content ?? ''}`);
  const { error } = await supabase
    .from('articles')
    .update({ status: 'pending' })
    .eq('id', id)
    .eq('author_id', user.id);
  if (error) redirect(`/espace/redaction/${id}?error=forbidden`);

  await audit({ actorId: user.id, action: 'article_submitted', targetType: 'article', targetId: id });
  await notifyCapabilityHolders({
    capability: 'moderate',
    type: 'admin_queue',
    payload: { kind: 'article', article_id: id, auto_flagged: flagged },
  });
  redirect('/espace/redaction?submitted=1');
}

/** F-13 — soft-delete d'un brouillon (RLS articles_delete own+draft). */
export async function deleteArticleDraft(formData: FormData): Promise<void> {
  const user = await requireUser('/espace/redaction');
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('articles').delete().eq('id', id).eq('author_id', user.id).eq('status', 'draft');
  revalidatePath('/espace/redaction');
  redirect('/espace/redaction');
}

/**
 * F-13 — décision de modération sur un article (capacité moderate).
 * pending → published (published_at + réindex search via trigger) / rejected (motif).
 */
export async function decideArticle(formData: FormData): Promise<void> {
  const moderator = await requireUser('/admin/blog');
  await requireCapability('moderate');

  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = (formData.get('reason') as string) || null;
  if (!id || !['published', 'rejected'].includes(decision)) redirect('/admin/blog');
  if (decision === 'rejected' && (!reason || reason.length < 3)) {
    redirect('/admin/blog?error=reason');
  }

  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('id, author_id, title, status')
    .eq('id', id)
    .maybeSingle();
  if (!article || article.status !== 'pending') redirect('/admin/blog?error=concurrent');

  const { error } = await supabase
    .from('articles')
    .update({
      status: decision as 'published' | 'rejected',
      published_at: decision === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) redirect('/admin/blog?error=forbidden');

  await audit({
    actorId: moderator.id,
    action: `article_${decision}`,
    targetType: 'article',
    targetId: id,
    reason: reason ?? undefined,
  });
  await notify({
    userId: article.author_id,
    type: 'article_status',
    payload: { article_id: id, status: decision, reason },
  });
  redirect('/admin/blog?done=1');
}
