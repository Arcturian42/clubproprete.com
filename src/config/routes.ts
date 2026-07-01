/**
 * Cartographie des routes & gardes (Annexe C — docs/10-routes-storage.md).
 * Middleware auth : route protégée sans session → 302 /login?next=...
 */
import type { Capability } from './capabilities';

/**
 * Segments réservés en tête d'URL — protègent la route dynamique /[type]/[slug]
 * (fiche entité) des collisions avec les routes publiques statiques.
 * Un segment de premier niveau ∈ RESERVED_TOP_SEGMENTS n'est jamais traité
 * comme un type d'entité.
 */
export const RESERVED_TOP_SEGMENTS = [
  'annuaire',
  'p',
  'blog',
  'emploi',
  'formations',
  'association',
  'ressources',
  'devenir-redacteur',
  'a-propos',
  'contact',
  'mentions-legales',
  'confidentialite',
  'login',
  'signup',
  'reset',
  'espace',
  'admin',
  'api',
] as const;

/** Slugs d'URL pour le type d'entité (route /[type]/{slug}). */
export const ENTITY_TYPE_SLUGS = {
  company: 'societe',
  supplier: 'fournisseur',
  training_org: 'centre-formation',
  independent: 'independant',
} as const;

/** Préfixes noindex (espace membre + back-office). */
export const NOINDEX_PREFIXES = ['/espace', '/admin'] as const;

/** Gardes par capacité pour les routes /espace/* et /admin/*. */
export const ROUTE_CAPABILITY_GUARDS: { prefix: string; capability: Capability }[] = [
  { prefix: '/espace/redaction', capability: 'write_article' },
  { prefix: '/espace/sous-traitance', capability: 'access_subcontracting' },
  { prefix: '/admin', capability: 'admin_panel' },
];

/** Routes /admin/* accessibles avec `moderate` (files de modération) à défaut d'admin_panel. */
export const MODERATE_ADMIN_PREFIXES = ['/admin/moderation', '/admin/demandes'] as const;
