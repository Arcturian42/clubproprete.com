import { z } from 'zod';

/** F-12 — candidature rédacteur. */
export const authorApplicationSchema = z.object({
  expertise: z.string().trim().min(3, 'Précisez votre domaine.').max(200),
  motivation: z.string().trim().min(20, 'Quelques mots sur votre motivation (20 caractères min).').max(1000),
});

/** F-13/F-17 — édition d'article. Le contenu est du Markdown (sanitizé serveur). */
export const articleDraftSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(5, 'Titre trop court.').max(160),
  contentMarkdown: z.string().trim().min(50, 'Article trop court (50 caractères min).').max(50000),
  categoryId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  featuredImage: z
    .string()
    .url()
    .startsWith('https://')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type AuthorApplicationInput = z.infer<typeof authorApplicationSchema>;
export type ArticleDraftInput = z.infer<typeof articleDraftSchema>;
