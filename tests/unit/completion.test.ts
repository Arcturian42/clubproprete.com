import { describe, expect, it } from 'vitest';
import { computeCompletion, type CompletionSource } from '@/features/entities/completion';

const EMPTY: CompletionSource = {
  name: null,
  siret: null,
  inseeCode: null,
  servicesCount: 0,
  segmentsCount: 0,
  logoUrl: null,
  photosCount: 0,
  website: null,
  googleMapsUrl: null,
  googleBusinessUrl: null,
  serviceAreasCount: 0,
  description: null,
  verified: false,
};

const FULL: CompletionSource = {
  name: 'Net Lyon',
  siret: '12345678901234',
  inseeCode: '69123',
  servicesCount: 3,
  segmentsCount: 2,
  logoUrl: 'https://x/logo.png',
  photosCount: 3,
  website: 'https://x.fr',
  googleMapsUrl: 'https://maps.google.com/x',
  googleBusinessUrl: 'https://business.google.com/x',
  serviceAreasCount: 2,
  description: 'Une description suffisamment longue pour compter dans le score.',
  verified: true,
};

describe('score de complétion (barème PRD 10.1)', () => {
  it('fiche vide = 0, Incomplet, 12 manquants', () => {
    const r = computeCompletion(EMPTY);
    expect(r.score).toBe(0);
    expect(r.label).toBe('Incomplet');
    expect(r.missing).toHaveLength(12);
  });

  it('fiche complète = 100, Optimisé', () => {
    const r = computeCompletion(FULL);
    expect(r.score).toBe(100);
    expect(r.label).toBe('Optimisé');
    expect(r.missing).toHaveLength(0);
  });

  it('cas de contrôle SQL (nom+siret+ville+service+site+description = 48)', () => {
    // Miroir du smoke test entity_completion_score (0003) : les deux
    // implémentations doivent rester alignées sur le barème.
    const r = computeCompletion({
      ...EMPTY,
      name: 'Propre & Net Lyon',
      siret: '12345678901239',
      inseeCode: '69123',
      servicesCount: 1,
      website: 'https://exemple.fr',
      description: 'Nettoyage de bureaux et copropriétés sur Lyon',
    });
    expect(r.score).toBe(48);
    expect(r.label).toBe('Incomplet');
  });

  it('seuils : 50 → Correct, 80 → Optimisé', () => {
    // 10+10+12+6+10+8 = 56 → Correct
    const correct = computeCompletion({
      ...EMPTY,
      name: 'X',
      siret: '1',
      inseeCode: '1',
      servicesCount: 1,
      segmentsCount: 1,
      logoUrl: 'x',
      photosCount: 3,
    });
    expect(correct.score).toBe(56);
    expect(correct.label).toBe('Correct');

    // 100 - 10 (vérifiée) - 6 (GBP) = 84 → Optimisé
    const optimise = computeCompletion({ ...FULL, verified: false, googleBusinessUrl: null });
    expect(optimise.score).toBe(84);
    expect(optimise.label).toBe('Optimisé');
  });

  it('description < 30 caractères ne compte pas', () => {
    const r = computeCompletion({ ...EMPTY, description: 'Trop court' });
    expect(r.score).toBe(0);
  });
});
