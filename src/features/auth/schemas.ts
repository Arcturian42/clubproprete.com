import { z } from 'zod';
import { emailSchema } from '@/lib/validation/patterns';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis.'),
  next: z.string().startsWith('/').optional().catch(undefined),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Au moins 8 caractères.')
    .max(72, 'Au plus 72 caractères.'),
  firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
  lastName: z.string().trim().min(1, 'Nom requis.').max(80),
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Au moins 8 caractères.').max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
