import type {
  ServiceType,
  ClientSegment,
  SupplierFamily,
  TrainingCertification,
  EntityType,
} from './index';

/** Libellés FR des référentiels — UI uniquement (les clés restent la vérité). */

export const SERVICE_LABELS: Record<ServiceType, string> = {
  nettoyage_bureaux: 'Nettoyage de bureaux',
  nettoyage_industriel: 'Nettoyage industriel',
  nettoyage_vitres: 'Nettoyage de vitres',
  nettoyage_apres_chantier: 'Nettoyage après chantier',
  remise_en_etat: 'Remise en état',
  decapage_sols: 'Décapage de sols',
  cristallisation_marbre: 'Cristallisation de marbre',
  entretien_courant: 'Entretien courant',
  desinfection: 'Désinfection',
  desinsectisation: 'Désinsectisation',
  deratisation: 'Dératisation',
  nettoyage_cryogenique: 'Nettoyage cryogénique',
  nettoyage_hospitalier: 'Nettoyage hospitalier',
  nettoyage_agroalimentaire: 'Nettoyage agroalimentaire',
  entretien_espaces_verts: 'Entretien des espaces verts',
  debarras: 'Débarras',
  nettoyage_haute_pression: 'Nettoyage haute pression',
  nettoyage_textile_moquette: 'Nettoyage textile & moquette',
  gestion_dechets: 'Gestion des déchets',
  proprete_urbaine: 'Propreté urbaine',
};

export const SEGMENT_LABELS: Record<ClientSegment, string> = {
  bureaux: 'Bureaux',
  industrie: 'Industrie',
  sante: 'Santé',
  collectivites: 'Collectivités',
  retail_commerces: 'Retail & commerces',
  hotellerie_restauration: 'Hôtellerie-restauration',
  coproprietes: 'Copropriétés',
  education: 'Éducation',
  transport_logistique: 'Transport & logistique',
  agroalimentaire: 'Agroalimentaire',
};

export const FAMILY_LABELS: Record<SupplierFamily, string> = {
  machines: 'Machines',
  produits_chimiques: 'Produits chimiques',
  consommables: 'Consommables',
  equipements_protection: 'Équipements de protection',
  materiel_manuel: 'Matériel manuel',
  logiciels: 'Logiciels',
  services: 'Services',
};

export const CERTIFICATION_LABELS: Record<TrainingCertification, string> = {
  Qualiopi: 'Qualiopi',
  CACES: 'CACES',
  SST: 'SST',
  habilitation_electrique: 'Habilitation électrique',
  CQP_proprete: 'CQP Propreté',
  certification_ISO: 'Certification ISO',
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  company: 'Société de nettoyage',
  supplier: 'Fournisseur',
  training_org: 'Centre de formation',
  independent: 'Indépendant',
};

/** Libellé lisible d'une sous-catégorie fournisseur (clé → « clé lisible »). */
export function subCategoryLabel(key: string): string {
  return key.replaceAll('_', ' ');
}
