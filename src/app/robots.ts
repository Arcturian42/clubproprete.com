import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** /espace et /admin en noindex (Annexe C). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/espace/', '/admin/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
