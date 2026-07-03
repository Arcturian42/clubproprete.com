/**
 * Liste noire de mots-clés — auto-modération niveau 1 (PRD 21.3) : un contenu
 * qui matche est auto-masqué (flagged / status révisable) + alerte modération.
 * Liste minimale à constituer avant l'ouverture UGC (Annexe F) ; volontairement
 * conservatrice. La modération humaine reste l'autorité.
 */
const BLACKLIST = [
  // insultes / haine (échantillon FR à étoffer avant ouverture publique)
  'connard',
  'salopard',
  'enculé',
  'pute',
  'nègre',
  'bougnoule',
  // arnaque manifeste
  'arnaque garantie',
  'argent facile',
] as const;

/** true si le texte contient un terme de la liste noire (insensible casse/accents). */
export function hitsBlacklist(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return BLACKLIST.some((word) => normalized.includes(word));
}
