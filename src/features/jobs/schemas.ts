import { z } from 'zod';
import { refEnum } from '@/lib/validation/patterns';
import { CONTRACT_TYPES } from '@/referentiels';
import { citySchema } from '@/features/onboarding/schemas';

/** F-10 — publication d'offre. Géo obligatoire (recherche géolocalisée T1). */
export const jobSchema = z.object({
  id: z.string().uuid().optional(),
  entityId: z.string().uuid(),
  title: z.string().trim().min(5, 'Titre trop court.').max(160),
  contractType: refEnum(CONTRACT_TYPES),
  description: z.string().trim().min(30, 'Description trop courte.').max(8000),
  city: citySchema,
  expiresInDays: z.coerce.number().int().min(7).max(90).default(30),
});

/** F-10 — candidature à une offre. */
export const jobApplicationSchema = z.object({
  jobId: z.string().uuid(),
  message: z.string().trim().max(2000).optional(),
  cvUrl: z
    .string()
    .url()
    .startsWith('https://')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

/** F-10 — alerte emploi. */
export const jobAlertSchema = z.object({
  roleQuery: z.string().trim().max(120).optional(),
  area: z.string().trim().max(120).optional(),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
});

export type JobInput = z.infer<typeof jobSchema>;
