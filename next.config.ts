import type { NextConfig } from 'next';

/**
 * En-têtes de sécurité (CSP stricte — cf. docs/06-ops-search-notif.md §19.6).
 * Les origines {Supabase}/{Storage} sont injectées depuis l'env.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${supabaseUrl}`,
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // geo.api.gouv.fr : autocomplétion ville (INSEE) ; recherche-entreprises : SIRET (PRD 10.2)
  `connect-src 'self' ${supabaseUrl} wss://${supabaseUrl.replace('https://', '')} https://geo.api.gouv.fr https://recherche-entreprises.api.gouv.fr`,
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseUrl
      ? [{ protocol: 'https', hostname: new URL(supabaseUrl).hostname }]
      : [],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
