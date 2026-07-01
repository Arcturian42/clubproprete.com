import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Sitemap (placeholder Phase 0) — routes institutionnelles statiques.
 * MVP 1+ : régénéré à chaque publication (entités, profils publics, articles,
 * offres, pages géo /annuaire/{type}/{region}/{ville}).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/a-propos', '/contact', '/mentions-legales', '/confidentialite'];
  return staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.5,
  }));
}
