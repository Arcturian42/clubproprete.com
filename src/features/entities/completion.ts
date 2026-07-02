/**
 * Score de complétion de fiche — barème PRD 10.1 (total 100).
 * Calcul serveur, recalculé à chaque sauvegarde/affichage. Le même barème
 * sera porté en RPC Postgres (0003) pour les agrégations d'annuaire.
 */
export interface CompletionSource {
  name: string | null;
  siret: string | null;
  inseeCode: string | null;
  servicesCount: number;
  segmentsCount: number;
  logoUrl: string | null;
  photosCount: number;
  website: string | null;
  googleMapsUrl: string | null;
  googleBusinessUrl: string | null;
  serviceAreasCount: number;
  description: string | null;
  verified: boolean;
}

export const COMPLETION_WEIGHTS = {
  nameSiret: 10,
  city: 10,
  services: 12,
  segments: 6,
  logo: 10,
  photos: 8,
  website: 8,
  maps: 6,
  business: 6,
  areas: 6,
  description: 8,
  verified: 10,
} as const;

export interface CompletionResult {
  score: number; // 0–100
  label: 'Incomplet' | 'Correct' | 'Optimisé';
  missing: string[]; // clés lisibles des éléments manquants (pour l'UI)
}

export function computeCompletion(src: CompletionSource): CompletionResult {
  let score = 0;
  const missing: string[] = [];
  const add = (ok: boolean, pts: number, label: string) => {
    if (ok) score += pts;
    else missing.push(label);
  };

  add(Boolean(src.name && src.siret), COMPLETION_WEIGHTS.nameSiret, 'Nom + SIRET');
  add(Boolean(src.inseeCode), COMPLETION_WEIGHTS.city, 'Ville normalisée');
  add(src.servicesCount >= 1, COMPLETION_WEIGHTS.services, 'Au moins un service');
  add(src.segmentsCount >= 1, COMPLETION_WEIGHTS.segments, 'Segments clients');
  add(Boolean(src.logoUrl), COMPLETION_WEIGHTS.logo, 'Logo');
  add(src.photosCount >= 3, COMPLETION_WEIGHTS.photos, 'Au moins 3 photos');
  add(Boolean(src.website), COMPLETION_WEIGHTS.website, 'Site web');
  add(Boolean(src.googleMapsUrl), COMPLETION_WEIGHTS.maps, 'Lien Google Maps');
  add(Boolean(src.googleBusinessUrl), COMPLETION_WEIGHTS.business, 'Lien Google Business');
  add(src.serviceAreasCount >= 1, COMPLETION_WEIGHTS.areas, "Zones d'intervention");
  add(Boolean(src.description && src.description.trim().length >= 30), COMPLETION_WEIGHTS.description, 'Description');
  add(src.verified, COMPLETION_WEIGHTS.verified, 'Fiche vérifiée');

  // Seuils PRD : < 50 Incomplet · 50–79 Correct · ≥ 80 Optimisé
  const label = score < 50 ? 'Incomplet' : score < 80 ? 'Correct' : 'Optimisé';
  return { score, label, missing };
}
