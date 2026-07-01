import { describe, expect, it } from 'vitest';
import {
  SERVICE_TYPES,
  SUPPLIER_FAMILIES,
  SUPPLIER_FAMILY_KEYS,
  CONTRACT_TYPES,
} from '@/referentiels';
import { refEnum, slugSchema, siretSchema } from '@/lib/validation/patterns';

describe('référentiels (source unique)', () => {
  it('les services propreté sont une liste fermée non vide', () => {
    expect(SERVICE_TYPES.length).toBeGreaterThan(0);
    expect(new Set(SERVICE_TYPES).size).toBe(SERVICE_TYPES.length); // pas de doublon
  });

  it('chaque famille fournisseur a des sous-catégories', () => {
    for (const family of SUPPLIER_FAMILY_KEYS) {
      expect(SUPPLIER_FAMILIES[family].length).toBeGreaterThan(0);
    }
  });

  it('refEnum rejette une valeur hors référentiel', () => {
    const schema = refEnum(CONTRACT_TYPES);
    expect(schema.safeParse('CDI').success).toBe(true);
    expect(schema.safeParse('CDX').success).toBe(false);
  });
});

describe('patterns Zod', () => {
  it('slug', () => {
    expect(slugSchema.safeParse('ma-societe-69').success).toBe(true);
    expect(slugSchema.safeParse('Ma Société').success).toBe(false);
  });
  it('siret', () => {
    expect(siretSchema.safeParse('12345678901234').success).toBe(true);
    expect(siretSchema.safeParse('123').success).toBe(false);
  });
});
