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
  error_generic: "Une erreur est survenue. Réessayez ou contactez le support si cela persiste.",
  error_forbidden: "Vous n'avez pas les droits nécessaires pour cette action.",
  error_not_found: 'Cette ressource est introuvable ou a été supprimée.',

  // États vides
  empty_messages:
    "Vous n'avez pas encore de messages. Trouvez un professionnel près de chez vous pour démarrer.",
  empty_search: 'Aucun résultat — élargissez la zone ou modifiez vos filtres.',
  empty_requests: 'Aucune demande.',

  // Succès
  success_article_submitted:
    'Votre article « {titre} » est soumis. Il sera relu avant publication et vous serez notifié.',
  success_verification_requested:
    'Demande envoyée. Nous vous appellerons sur le créneau choisi : {date} {creneau}.',
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
