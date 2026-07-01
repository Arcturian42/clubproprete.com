/**
 * Types de notifications — liste fermée (docs/06-ops-search-notif.md §15).
 * notification_preferences(user_id, type, channel, enabled) s'y réfère.
 * Les types "essentiels" sont toujours envoyés (non désactivables).
 */
export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface NotificationTypeDef {
  channels: NotificationChannel[];
  essential: boolean;
  note?: string;
}

export const NOTIFICATION_TYPES = {
  connection_request: { channels: ['in_app', 'email'], essential: false },
  connection_accepted: { channels: ['in_app', 'email'], essential: false },
  new_follower: { channels: ['in_app'], essential: false },
  new_recommendation: { channels: ['in_app', 'email'], essential: false },
  new_message: { channels: ['in_app', 'email'], essential: false, note: 'groupé 10 min' },
  group_added: { channels: ['in_app'], essential: false, note: 'Phase 3' },
  verification_decision: { channels: ['in_app', 'email'], essential: true },
  claim_decision: { channels: ['in_app', 'email'], essential: true },
  author_decision: { channels: ['in_app', 'email'], essential: true },
  article_status: { channels: ['in_app', 'email'], essential: true, note: 'essentiel au refus' },
  membership_decision: { channels: ['in_app', 'email'], essential: true },
  removal_decision: { channels: ['in_app', 'email'], essential: true },
  job_application_received: { channels: ['in_app', 'email'], essential: false },
  application_status: { channels: ['in_app', 'email'], essential: false },
  job_alert: { channels: ['email'], essential: false },
  moderation_action: { channels: ['in_app', 'email'], essential: true },
  admin_queue: { channels: ['in_app'], essential: true, note: 'essentiel par rôle' },
  mission_application: { channels: ['in_app', 'email'], essential: false },
  gdpr_export_ready: { channels: ['in_app', 'email'], essential: true },
} as const satisfies Record<string, NotificationTypeDef>;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;
