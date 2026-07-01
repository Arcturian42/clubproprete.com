/**
 * Capacités — autorisation 100 % par capacités (aucun claim JWT `role`).
 * Source : docs/01-architecture-roles.md §17, docs/04-security-rls.md.
 *
 * Seules ces 6 capacités sont STOCKÉES dans user_capabilities et injectées
 * dans le claim JWT `capabilities` par le custom_access_token_hook.
 * send_message / connect / follow / recommend NE SONT PAS des capacités
 * (actions ouvertes à tout authentifié, gate = participation/propriété/blocage).
 */
export const CAPABILITIES = [
  'write_article',
  'publish_job',
  'publish_mission',
  'access_subcontracting',
  'moderate',
  'admin_panel',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Rôles d'identité (profiles.main_role, contrainte CHECK côté SQL).
 * Sert au routing/identité — JAMAIS à l'autorisation. Lu en base, pas dans le JWT.
 */
export const MAIN_ROLES = [
  'registered_user',
  'company_owner',
  'verified_company',
  'supplier_owner',
  'verified_supplier',
  'training_org_owner',
  'verified_training_org',
  'independent',
  'verified_independent',
  'candidate',
  'author',
  'admin',
  'super_admin',
] as const;
export type MainRole = (typeof MAIN_ROLES)[number];
