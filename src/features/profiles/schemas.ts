import { z } from 'zod';
import { VISIBILITY_LEVELS } from '@/referentiels';
import { citySchema } from '@/features/onboarding/schemas';

/** F-04 — édition du profil. Ville re-normalisée si modifiée. */
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
  lastName: z.string().trim().min(1, 'Nom requis.').max(80),
  headline: z.string().trim().max(120, '120 caractères maximum.').optional(),
  bio: z.string().trim().max(2000, '2000 caractères maximum.').optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+33|0)[1-9](\d{2}){4}$/, 'Numéro français invalide.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  visibility: z.enum(VISIBILITY_LEVELS),
  city: citySchema.nullable(),
  skillIds: z.array(z.string().uuid()).max(20, '20 compétences maximum.'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
