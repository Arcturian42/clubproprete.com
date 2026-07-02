/**
 * Cartographie des routes & gardes (Annexe C — docs/10-routes-storage.md).
 * Middleware auth : route protégée sans session → 302 /login?next=...
 */
import type { Capability } from './capabilities';
import type { EntityType } from '@/referentiels';

/**
 * Segments réservés en tête d'URL — protègent la route dynamique /[type]/[slug]
 * (fiche entité) des collisions avec les routes publiques statiques.
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
  'auth',
  'espace',
  'admin',
  'api',
] as const;

/** Slugs d'URL de la fiche entité publique : /{type}/{slug} (singulier). */
export const ENTITY_TYPE_SLUGS: Record<EntityType, string> = {
  company: 'societe',
  supplier: 'fournisseur',
  training_org: 'centre-formation',
  independent: 'independant',
};

/** Slugs d'URL de l'annuaire : /annuaire/{type} (pluriel). */
export const DIRECTORY_TYPE_SLUGS: Record<EntityType, string> = {
  company: 'societes',
  supplier: 'fournisseurs',
  training_org: 'centres-formation',
  independent: 'independants',
};

/** Résolution inverse slug d'annuaire → entity_type (404 sinon). */
export function directorySlugToType(slug: string): EntityType | null {
  const found = (Object.entries(DIRECTORY_TYPE_SLUGS) as [EntityType, string][]).find(
    ([, s]) => s === slug,
  );
  return found ? found[0] : null;
}

/** Résolution inverse slug de fiche → entity_type (404 sinon). */
export function entitySlugToType(slug: string): EntityType | null {
  const found = (Object.entries(ENTITY_TYPE_SLUGS) as [EntityType, string][]).find(
    ([, s]) => s === slug,
  );
  return found ? found[0] : null;
}

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
