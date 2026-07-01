import { z } from 'zod';

/**
 * Patterns Zod de base — validation serveur de toute entrée (§19.6).
 * Les enums métier se construisent depuis src/referentiels (source unique).
 */

export const emailSchema = z.string().trim().toLowerCase().email();

/** Slug URL : minuscules, chiffres, tirets. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, tirets uniquement).');

/** SIRET : exactement 14 chiffres. */
export const siretSchema = z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres).');

/** URL https uniquement. */
export const httpsUrlSchema = z
  .string()
  .url()
  .startsWith('https://', 'URL non sécurisée (https requis).');

/** Code INSEE (5 caractères). */
export const inseeSchema = z.string().regex(/^\d[0-9AB]\d{3}$/, 'Code INSEE invalide.');

/** Code postal français (5 chiffres). */
export const postalCodeSchema = z.string().regex(/^\d{5}$/, 'Code postal invalide.');

/**
 * Construit un enum Zod à partir d'une liste fermée de référentiel.
 * Usage : refEnum(SERVICE_TYPES).
 */
export function refEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values);
}
