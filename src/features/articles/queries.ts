import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Tables } from '@/types/database.types';

export type Article = Tables<'articles'>;

export interface AuthorPiles {
  drafts: Article[];
  pending: Article[];
  published: Article[];
}

/** Les 3 piles de l'espace rédaction (RLS : own). */
export async function getMyArticles(userId: string): Promise<AuthorPiles> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('author_id', userId)
    .order('updated_at', { ascending: false });

  const all = (data ?? []) as Article[];
  return {
    drafts: all.filter((a) => a.status === 'draft' || a.status === 'rejected'),
    pending: all.filter((a) => a.status === 'pending'),
    published: all.filter((a) => a.status === 'published' && !a.deleted_at),
  };
}

/** Un article à éditer (own). */
export async function getArticleForEdit(id: string, userId: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('author_id', userId)
    .maybeSingle();
  return data;
}

export interface PublicArticle extends Article {
  author: { slug: string; first_name: string | null; last_name: string | null; photo_url: string | null };
}

/** Liste des articles publiés pour /blog (client anonyme, ISR). */
export async function getPublishedArticles(limit = 20): Promise<PublicArticle[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('articles')
    .select('*, author:profiles!articles_author_id_fkey(slug, first_name, last_name, photo_url)')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PublicArticle[];
}

/** Un article publié par slug (client anonyme, ISR). */
export async function getPublishedArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('articles')
    .select('*, author:profiles!articles_author_id_fkey(slug, first_name, last_name, photo_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  return data as unknown as PublicArticle | null;
}

/** Articles publiés d'un auteur (affichés sur son profil public — F-13). */
export async function getPublishedArticlesByAuthor(authorId: string): Promise<Article[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(10);
  return (data ?? []) as Article[];
}
