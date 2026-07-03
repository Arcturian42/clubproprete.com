import type { NotificationType } from '@/config/notifications';

/** Rendu lisible d'une notification (titre + lien) selon son type et payload. */
export function describeNotification(
  type: string,
  payload: Record<string, unknown>,
): { title: string; href: string } {
  const decision = payload.decision === 'approved' ? 'approuvée' : 'refusée';
  const map: Partial<Record<NotificationType, { title: string; href: string }>> = {
    verification_decision: {
      title: `Votre demande de vérification a été ${decision}.`,
      href: '/espace/fiches',
    },
    author_decision: {
      title: `Votre candidature de rédacteur a été ${decision}.`,
      href: '/espace/redaction',
    },
    article_status: {
      title:
        payload.status === 'published'
          ? 'Votre article a été publié.'
          : 'Votre article nécessite des corrections.',
      href: '/espace/redaction',
    },
    membership_decision: {
      title: `Votre adhésion à l'association a été ${decision}.`,
      href: '/espace/sous-traitance',
    },
    connection_request: { title: 'Nouvelle demande de connexion.', href: '/espace/reseau' },
    connection_accepted: { title: 'Votre connexion a été acceptée.', href: '/espace/reseau' },
    new_follower: { title: 'Un professionnel vous suit désormais.', href: '/espace/reseau' },
    new_recommendation: { title: 'Vous avez reçu une recommandation.', href: '/espace/profil' },
    new_message: { title: 'Nouveau message reçu.', href: '/espace/messages' },
    job_application_received: {
      title: 'Nouvelle candidature à une de vos offres.',
      href: '/espace/offres',
    },
    application_status: {
      title: 'Le statut de votre candidature a évolué.',
      href: '/espace/candidatures',
    },
    mission_application: {
      title: 'Nouvelle candidature à une mission.',
      href: '/espace/sous-traitance',
    },
    moderation_action: {
      title: 'Une décision de modération concerne votre contenu.',
      href: '/espace',
    },
    admin_queue: { title: 'Nouvelle demande en file de modération.', href: '/admin/demandes' },
    removal_decision: { title: 'Une demande de retrait a été traitée.', href: '/espace/fiches' },
    claim_decision: { title: 'Votre revendication de fiche a été traitée.', href: '/espace/fiches' },
    job_alert: { title: 'Une offre correspond à votre alerte.', href: '/emploi' },
    gdpr_export_ready: { title: 'Votre export de données est prêt.', href: '/espace/parametres' },
  };
  return map[type as NotificationType] ?? { title: 'Nouvelle notification.', href: '/espace' };
}
