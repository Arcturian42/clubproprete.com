import { describe, expect, it } from 'vitest';
import { onboardingSchema } from '@/features/onboarding/schemas';
import { entityEditSchema } from '@/features/entities/schemas';
import { decisionSchema } from '@/features/verification/schemas';

const CITY = {
  cityName: 'Lyon',
  inseeCode: '69123',
  postalCode: '69001',
  department: 'Rhône',
  region: 'Auvergne-Rhône-Alpes',
  lat: 45.764,
  lng: 4.8357,
};

describe('onboarding (F-01)', () => {
  it('accepte un cumul de situations avec détails complets (AC 01.4)', () => {
    const r = onboardingSchema.safeParse({
      firstName: 'Olivia',
      lastName: 'Owner',
      city: CITY,
      situations: ['company', 'independent'],
      company: { name: 'Net Lyon' },
      independent: {},
    });
    expect(r.success).toBe(true);
  });

  it('refuse une situation cochée sans son bloc de détails', () => {
    const r = onboardingSchema.safeParse({
      firstName: 'O',
      lastName: 'O',
      city: CITY,
      situations: ['supplier'],
    });
    expect(r.success).toBe(false);
  });

  it('refuse une sous-catégorie hors famille (référentiel G.3)', () => {
    const r = onboardingSchema.safeParse({
      firstName: 'O',
      lastName: 'O',
      city: CITY,
      situations: ['supplier'],
      supplier: { name: 'Equip', family: 'machines', subCategory: 'detergents' },
    });
    expect(r.success).toBe(false);
  });

  it('refuse une ville non normalisée (INSEE manquant — AC 01.2)', () => {
    const r = onboardingSchema.safeParse({
      firstName: 'O',
      lastName: 'O',
      city: { ...CITY, inseeCode: '' },
      situations: ['candidate'],
    });
    expect(r.success).toBe(false);
  });
});

describe('fiches (F-05)', () => {
  it('refuse un service hors référentiel (AC 05.3)', () => {
    const r = entityEditSchema.safeParse({
      type: 'company',
      name: 'Net Lyon',
      services: ['nettoyage_lunaire'],
      segments: [],
      serviceAreas: [],
      city: null,
    });
    expect(r.success).toBe(false);
  });

  it('refuse une URL non https', () => {
    const r = entityEditSchema.safeParse({
      type: 'company',
      name: 'Net Lyon',
      website: 'http://insecure.fr',
      services: [],
      segments: [],
      serviceAreas: [],
      city: null,
    });
    expect(r.success).toBe(false);
  });
});

describe('vérification (F-06)', () => {
  it('refuse un refus sans motif (motif obligatoire)', () => {
    const r = decisionSchema.safeParse({
      requestId: '11111111-1111-1111-1111-111111111111',
      decision: 'rejected',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une approbation sans motif', () => {
    const r = decisionSchema.safeParse({
      requestId: '11111111-1111-1111-1111-111111111111',
      decision: 'approved',
    });
    expect(r.success).toBe(true);
  });
});
