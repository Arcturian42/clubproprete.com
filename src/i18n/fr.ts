/**
 * Microcopy FR-FR par clés techniques (i18n réversible — pas de champ `locale`).
 * Source : docs/05-ux-pages.md §8.2. Toute chaîne visible passe par une clé.
 * Interpolations : {var} remplacées par t(key, { var }).
 */
export const fr = {
  // Erreurs
  error_upload_image:
    "L'image n'a pas pu être chargée. Vérifiez qu'elle fait moins de 5 Mo (JPG ou PNG) et réessayez.",
  error_rate_limited: 'Trop de tentatives. Réessayez dans {delay}.',
  error_generic: 'Une erreur est survenue. Réessayez ou contactez le support si cela persiste.',
  error_forbidden: "Vous n'avez pas les droits nécessaires pour cette action.",
  error_not_found: 'Cette ressource est introuvable ou a été supprimée.',
  error_invalid_credentials: 'Email ou mot de passe incorrect.',
  error_email_taken: 'Un compte existe déjà avec cet email. Connectez-vous.',
  error_validation: 'Certains champs sont invalides. Corrigez-les et réessayez.',
  error_city_required: 'Sélectionnez une ville dans la liste (normalisation INSEE).',
  error_service_unknown: 'Service hors référentiel : sélectionnez une valeur de la liste.',

  // États vides
  empty_messages:
    "Vous n'avez pas encore de messages. Trouvez un professionnel près de chez vous pour démarrer.",
  empty_search: 'Aucun résultat — élargissez la zone ou modifiez vos filtres.',
  empty_requests: 'Aucune demande.',
  empty_entities: "Vous n'avez pas encore de fiche. Créez la vôtre en quelques minutes.",
  empty_directory: 'Aucun résultat — élargissez la zone ou retirez un filtre.',
  empty_profile_section: 'Cette section est vide pour le moment.',

  // Succès
  success_article_submitted:
    'Votre article « {titre} » est soumis. Il sera relu avant publication et vous serez notifié.',
  success_verification_requested:
    'Demande envoyée. Nous vous appellerons sur le créneau choisi : {date} {creneau}.',
  success_signup:
    'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.',
  success_password_reset_sent:
    'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.',
  success_password_updated: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
  success_profile_updated: 'Profil mis à jour.',
  success_entity_created: 'Votre fiche est créée et publiée dans l’annuaire.',
  success_entity_updated: 'Fiche mise à jour.',
  success_onboarding_done: 'Bienvenue ! Votre espace est prêt.',
  success_decision_saved: 'Décision enregistrée.',

  // Auth / commun
  cta_login: 'Se connecter',
  cta_signup: 'Créer un compte',
  cta_logout: 'Se déconnecter',
  cta_save: 'Enregistrer',
  cta_send: 'Envoyer',
  cta_retry: 'Réessayer',
  cta_create_entity: 'Créer ma fiche',
} as const;

export type MicrocopyKey = keyof typeof fr;

/** Traduit une clé avec interpolation simple {var}. */
export function t(key: MicrocopyKey, vars?: Record<string, string | number>): string {
  let out: string = fr[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}
