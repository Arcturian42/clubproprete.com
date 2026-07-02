/** Slugification FR (accents retirés, a-z0-9-, pattern PRD `^[a-z0-9-]+$`). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Suffixe court aléatoire pour garantir l'unicité d'un slug. */
export function slugWithSuffix(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 7);
  const s = slugify(base);
  return s ? `${s}-${suffix}` : suffix;
}
