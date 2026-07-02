import { z } from 'zod';

/**
 * F-06 — demande de vérification : créneaux structurés + questionnaire.
 * Les preuves (bucket verification-proofs, Annexe B/T9) seront branchées avec
 * l'upload Storage ; la demande reste valable sans pièce (contrôle par appel).
 */
export const verificationRequestSchema = z.object({
  entityId: z.string().uuid(),
  seniority: z.enum(['moins_1_an', '1_3_ans', '3_10_ans', 'plus_10_ans'], {
    message: 'Ancienneté requise.',
  }),
  headcount: z.enum(['solo', '2_10', '11_50', '51_200', 'plus_200'], {
    message: 'Effectif requis.',
  }),
  slots: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.'),
        period: z.enum(['matin', 'apres_midi']),
      }),
    )
    .min(1, 'Proposez au moins un créneau.')
    .max(3),
});

export const decisionSchema = z
  .object({
    requestId: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((d, ctx) => {
    // Motif OBLIGATOIRE au refus (PRD 8 — back-office demandes).
    if (d.decision === 'rejected' && (!d.reason || d.reason.length < 3)) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Motif obligatoire pour un refus.' });
    }
  });

export const SENIORITY_LABELS = {
  moins_1_an: "Moins d'un an",
  '1_3_ans': '1 à 3 ans',
  '3_10_ans': '3 à 10 ans',
  plus_10_ans: 'Plus de 10 ans',
} as const;

export const HEADCOUNT_LABELS = {
  solo: 'Solo',
  '2_10': '2 à 10',
  '11_50': '11 à 50',
  '51_200': '51 à 200',
  plus_200: 'Plus de 200',
} as const;
