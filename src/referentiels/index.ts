/**
 * Référentiels métier — SOURCE UNIQUE des listes fermées (Annexe G du PRD).
 * Voir docs/11-referentiels.md. Toute liste métier se définit ICI et se propage
 * (enums Zod, filtres UI, seed). Ne JAMAIS coder une de ces listes en dur ailleurs.
 *
 * Toute valeur hors liste est rejetée serveur (validation Zod).
 */

// G.1 — Services propreté (company_services.service_type)
export const SERVICE_TYPES = [
  'nettoyage_bureaux',
  'nettoyage_industriel',
  'nettoyage_vitres',
  'nettoyage_apres_chantier',
  'remise_en_etat',
  'decapage_sols',
  'cristallisation_marbre',
  'entretien_courant',
  'desinfection',
  'desinsectisation',
  'deratisation',
  'nettoyage_cryogenique',
  'nettoyage_hospitalier',
  'nettoyage_agroalimentaire',
  'entretien_espaces_verts',
  'debarras',
  'nettoyage_haute_pression',
  'nettoyage_textile_moquette',
  'gestion_dechets',
  'proprete_urbaine',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

// G.2 — Segments clients (companies.segments)
export const CLIENT_SEGMENTS = [
  'bureaux',
  'industrie',
  'sante',
  'collectivites',
  'retail_commerces',
  'hotellerie_restauration',
  'coproprietes',
  'education',
  'transport_logistique',
  'agroalimentaire',
] as const;
export type ClientSegment = (typeof CLIENT_SEGMENTS)[number];

// G.3 — Familles fournisseurs (suppliers.family) → sous-catégories (suppliers.sub_category)
export const SUPPLIER_FAMILIES = {
  machines: [
    'autolaveuses',
    'monobrosses',
    'aspirateurs',
    'nettoyeurs_haute_pression',
    'balayeuses',
    'injecteurs_extracteurs',
  ],
  produits_chimiques: [
    'detergents',
    'desinfectants',
    'decapants',
    'cires_emulsions',
    'produits_sanitaires',
    'produits_sols',
  ],
  consommables: ['essuyage', 'sacs_poubelle', 'sanitaire_papier', 'accessoires_lavage'],
  equipements_protection: ['gants', 'chaussures', 'vetements', 'masques', 'signalisation'],
  materiel_manuel: ['chariots', 'balais', 'raclettes', 'seaux_presses', 'microfibres'],
  logiciels: [
    'gestion_planning',
    'controle_qualite',
    'facturation',
    'pointage_mobile',
    'crm_proprete',
  ],
  services: ['formation', 'conseil', 'audit', 'location_materiel', 'maintenance'],
} as const;
export const SUPPLIER_FAMILY_KEYS = Object.keys(SUPPLIER_FAMILIES) as SupplierFamily[];
export type SupplierFamily = keyof typeof SUPPLIER_FAMILIES;
export type SupplierSubCategory =
  (typeof SUPPLIER_FAMILIES)[SupplierFamily][number];

// G.4 — Types de contrat (jobs.contract_type)
export const CONTRACT_TYPES = [
  'CDI',
  'CDD',
  'Freelance',
  'Stage',
  'Alternance',
  'Interim',
  'Temps_partiel',
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

// G.5 — Niveaux de visibilité (visibility_level, enum SQL)
export const VISIBILITY_LEVELS = ['public', 'members', 'connections', 'private'] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

// G.6 — Certifications centres de formation (training_orgs.certifications, indicatif)
export const TRAINING_CERTIFICATIONS = [
  'Qualiopi',
  'CACES',
  'SST',
  'habilitation_electrique',
  'CQP_proprete',
  'certification_ISO',
] as const;
export type TrainingCertification = (typeof TRAINING_CERTIFICATIONS)[number];

// Types d'entités (enum SQL entity_type)
export const ENTITY_TYPES = ['company', 'supplier', 'training_org', 'independent'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
