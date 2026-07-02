import { z } from 'zod';
import { httpsUrlSchema, siretSchema } from '@/lib/validation/patterns';
import { citySchema } from '@/features/onboarding/schemas';
import {
  SERVICE_TYPES,
  CLIENT_SEGMENTS,
  SUPPLIER_FAMILIES,
  SUPPLIER_FAMILY_KEYS,
  TRAINING_CERTIFICATIONS,
} from '@/referentiels';

/**
 * F-05 — édition de fiche par type. Toutes les listes fermées viennent des
 * référentiels (Annexe G) : toute valeur hors liste est rejetée serveur
 * (AC 05.3).
 */

const optionalUrl = httpsUrlSchema.optional().or(z.literal('').transform(() => undefined));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined));

export const companyEditSchema = z.object({
  type: z.literal('company'),
  name: z.string().trim().min(2, 'Nom requis.').max(120),
  legalName: optionalText(160),
  siret: siretSchema.optional().or(z.literal('').transform(() => undefined)),
  description: optionalText(3000),
  website: optionalUrl,
  linkedin: optionalUrl,
  googleMapsUrl: optionalUrl,
  googleBusinessUrl: optionalUrl,
  address: optionalText(240),
  headcount: optionalText(40),
  foundedYear: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .or(z.literal('').transform(() => undefined)),
  services: z.array(z.enum(SERVICE_TYPES)).max(SERVICE_TYPES.length),
  segments: z.array(z.enum(CLIENT_SEGMENTS)).max(CLIENT_SEGMENTS.length),
  serviceAreas: z.array(z.string().trim().min(1).max(80)).max(30),
  interventionRadius: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  city: citySchema.nullable(),
});

const supplierFamilyEnum = z.enum(
  SUPPLIER_FAMILY_KEYS as [keyof typeof SUPPLIER_FAMILIES, ...(keyof typeof SUPPLIER_FAMILIES)[]],
);

export const supplierEditSchema = z.object({
  type: z.literal('supplier'),
  name: z.string().trim().min(2, 'Nom requis.').max(120),
  family: supplierFamilyEnum,
  subCategory: z.string().min(1, 'Sous-catégorie requise.'),
  description: optionalText(3000),
  website: optionalUrl,
  city: citySchema.nullable(),
});

export const trainingOrgEditSchema = z.object({
  type: z.literal('training_org'),
  name: z.string().trim().min(2, 'Nom requis.').max(120),
  certifications: z.array(z.enum(TRAINING_CERTIFICATIONS)).max(TRAINING_CERTIFICATIONS.length),
  programsText: optionalText(5000), // décision v9 : formations en texte libre
  website: optionalUrl,
  city: citySchema.nullable(),
});

export const independentEditSchema = z.object({
  type: z.literal('independent'),
  headline: optionalText(120),
  serviceAreas: z.array(z.string().trim().min(1).max(80)).max(30),
  city: citySchema.nullable(),
});

export const entityEditSchema = z
  .discriminatedUnion('type', [
    companyEditSchema,
    supplierEditSchema,
    trainingOrgEditSchema,
    independentEditSchema,
  ])
  .superRefine((data, ctx) => {
    // Cohérence référentiel G.3 : la sous-catégorie appartient à la famille.
    if (data.type === 'supplier') {
      const subs = SUPPLIER_FAMILIES[data.family] as readonly string[];
      if (!subs.includes(data.subCategory)) {
        ctx.addIssue({
          code: 'custom',
          path: ['subCategory'],
          message: 'Sous-catégorie hors référentiel pour cette famille.',
        });
      }
    }
  });

export type EntityEditInput = z.infer<typeof entityEditSchema>;
export type CompanyEditInput = z.infer<typeof companyEditSchema>;
