import { z } from 'zod';
import {
  inseeSchema,
  postalCodeSchema,
  siretSchema,
  refEnum,
} from '@/lib/validation/patterns';
import { SUPPLIER_FAMILIES, SUPPLIER_FAMILY_KEYS } from '@/referentiels';

/**
 * F-01 — schémas de l'onboarding.
 * Étape Contact : ville NORMALISÉE (INSEE+CP+région+lat/lng jamais NULL — AC 01.2).
 */
export const citySchema = z.object({
  cityName: z.string().trim().min(1, 'Ville requise.'),
  inseeCode: inseeSchema,
  postalCode: postalCodeSchema,
  department: z.string().trim().min(1),
  region: z.string().trim().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/** Situations cochables (MULTIPLES possibles — AC 01.4). */
export const SITUATIONS = [
  'company',
  'supplier',
  'training_org',
  'independent',
  'candidate',
] as const;
export type Situation = (typeof SITUATIONS)[number];

const supplierFamilyEnum = z.enum(
  SUPPLIER_FAMILY_KEYS as [keyof typeof SUPPLIER_FAMILIES, ...(keyof typeof SUPPLIER_FAMILIES)[]],
);

/** Détails par situation (étape 4). Référentiels Annexe G validés serveur. */
export const onboardingSchema = z
  .object({
    city: citySchema,
    situations: z.array(z.enum(SITUATIONS)).min(1, 'Choisissez au moins une situation.'),
    firstName: z.string().trim().min(1, 'Prénom requis.').max(80),
    lastName: z.string().trim().min(1, 'Nom requis.').max(80),
    company: z
      .object({
        name: z.string().trim().min(2, "Nom de l'entreprise requis."),
        siret: siretSchema.optional().or(z.literal('').transform(() => undefined)),
      })
      .optional(),
    supplier: z
      .object({
        name: z.string().trim().min(2, 'Nom du fournisseur requis.'),
        family: supplierFamilyEnum,
        subCategory: z.string().min(1, 'Sous-catégorie requise.'),
      })
      .optional(),
    trainingOrg: z
      .object({
        name: z.string().trim().min(2, "Nom de l'organisme requis."),
      })
      .optional(),
    independent: z
      .object({
        headline: z.string().trim().max(120).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Chaque situation cochée exige son bloc de détails, et la sous-catégorie
    // fournisseur doit appartenir à la famille choisie (référentiel G.3).
    if (data.situations.includes('company') && !data.company) {
      ctx.addIssue({ code: 'custom', path: ['company'], message: 'Détails entreprise requis.' });
    }
    if (data.situations.includes('supplier')) {
      if (!data.supplier) {
        ctx.addIssue({ code: 'custom', path: ['supplier'], message: 'Détails fournisseur requis.' });
      } else {
        const subs = SUPPLIER_FAMILIES[data.supplier.family] as readonly string[];
        if (!subs.includes(data.supplier.subCategory)) {
          ctx.addIssue({
            code: 'custom',
            path: ['supplier', 'subCategory'],
            message: 'Sous-catégorie hors référentiel pour cette famille.',
          });
        }
      }
    }
    if (data.situations.includes('training_org') && !data.trainingOrg) {
      ctx.addIssue({ code: 'custom', path: ['trainingOrg'], message: 'Détails organisme requis.' });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export { refEnum };
