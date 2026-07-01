# Opérationnel, recherche & notifications

> Extrait du PRD ClubProprete.com v13 — chap. 14, 15, 19. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## 14. Clarifications du modèle (intégrité & cas limites)

### 14.1 Clé primaire de `profiles` & cibles des FK

`profiles` a pour PK `user_id` (référence `auth.users`). Pas de colonne `id` distincte. Toutes les FK « →profiles » (author_id, sender_id, from_user_id…) ciblent `profiles.user_id`. Les jointures se font sur `user_id`.

### 14.2 Suppression de compte vs conservation des messages

Le « masquage en cascade » à la suppression s'applique aux **surfaces publiques** (profil public, fiches, annuaire, articles), **pas** au contenu relationnel privé (messages). À la suppression : `deleted_at` + PII anonymisées (profil-tombstone) ; la ligne `profiles` subsiste (cible de FK valide) ; les surfaces publiques filtrent sur `deleted_at is null` ; la messagerie ne filtre PAS les messages sur le `deleted_at` de l'expéditeur (destinataire conserve l'historique, expéditeur = « Utilisateur supprimé »). La RLS `messages_read` reste « participant non bloqué OR (moderate & flagged) ».

### 14.3 Périmètre d'alimentation de `search_index`

| Table source | Condition d'indexation | type | Champs |
|---|---|---|---|
| entities (+spé.) | `status='active' AND deleted_at IS NULL` | 'entity' | nom, description (société/fournisseur)/programs_text, géo, filters{type,verified,services,region} |
| profiles | `visibility='public' AND deleted_at IS NULL` | 'profile' | nom, headline/bio/skills, géo, filters{region} |
| articles | `status='published' AND deleted_at IS NULL` (B3) | 'article' | title, excerpt, filters{category} |
| jobs | `status='published' AND deleted_at IS NULL AND non expiré` (B3) | 'job' | title, description, **géo (T1)**, filters{contract_type,region} |

À la dé-publication / expiration / suppression / passage privé / **soft-delete** : le trigger SUPPRIME la ligne de `search_index`. `missions` n'est pas indexée (contenu privé).

> **Correction A (v12)** : les tables filles (`companies`, `suppliers`, `training_orgs`, `independents`) portent chacune un trigger `sync_search_entity_child` qui réindexe l'entité parente via `reindex_entity(entity_id)`. Cela corrige (1) la course à la création — la fille existe quand son trigger part, donc le titre/description sont corrects dès le départ — et (2) l'absence de mise à jour de l'index quand seul le nom/description de la fille change.

---

## 15. Types de notifications (liste fermée)

`notification_preferences(user_id, type, channel, enabled)` se réfère à cette liste. Essentiel = toujours envoyé (in_app + email), non désactivable.

| type | Déclencheur | Canaux | Essentiel |
|---|---|---|---|
| `connection_request` | Demande de connexion reçue | in_app, email | Non |
| `connection_accepted` | Connexion acceptée | in_app, email | Non |
| `new_follower` | Nouveau suivi | in_app | Non |
| `new_recommendation` | Recommandation reçue | in_app, email | Non |
| `new_message` | Message reçu hors-ligne | in_app, email | Non (groupé 10 min) |
| `group_added` | Ajout à un groupe (Phase 3) | in_app | Non |
| `verification_decision` | Vérification approuvée/refusée | in_app, email | Oui |
| `claim_decision` | Revendication traitée | in_app, email | Oui |
| `author_decision` | Candidature rédacteur traitée | in_app, email | Oui |
| `article_status` | Article publié/refusé | in_app, email | Oui (refus) |
| `membership_decision` | Adhésion association traitée | in_app, email | Oui |
| `removal_decision` | Demande de retrait traitée | in_app, email | Oui |
| `job_application_received` | Candidature reçue (recruteur) | in_app, email | Non |
| `application_status` | Statut de candidature modifié | in_app, email | Non |
| `job_alert` | Offre correspondant à une alerte | email | Non |
| `moderation_action` | Décision de modération sur mon contenu | in_app, email | Oui |
| `admin_queue` | Nouvelle demande en file (admins) | in_app | Oui (rôle) |
| `mission_application` | Candidature à une mission | in_app, email | Non |
| `gdpr_export_ready` | Export RGPD prêt (lien signé) | in_app, email | Oui |

> T11 : `gdpr_export_ready` porte l'état transitoire de l'export RGPD (pas de table `gdpr_requests`).

---


## 19. Opérationnel technique

### 19.1 Frontières serveur / client & cache
- Mutations internes : Server Actions (Zod + `has_capability` + audit). Endpoints publics/externes : Route Handlers / Edge Functions. Accès Supabase serveur par défaut ; client via RLS pour le temps réel.
- RSC + RPC d'agrégation (anti N+1) ; ISR par tags ; pagination keyset ; TanStack Query pour l'interactif. Budget : LCP < 2,5 s, INP bas, CLS < 0,1.

### 19.2 Rate limiting
| Action | Limite | Fenêtre | Portée |
|---|---|---|---|
| Inscription | 5 | 1 h | IP |
| Connexion (échecs) | 5 | 15 min | email+IP |
| Reset mdp | 3 | 1 h | email |
| Candidature rédacteur | 1 active +2 | 7 j | user |
| Messages envoyés | 30 | 1 min | user |
| Nouvelles conversations | 20 | 1 j | user |
| Connexions | 50 | 1 j | user |
| Signalements | 20 | 1 j | user |
| Demande de retrait (F-25) | 5 | 1 j | IP |
| Contact | 10 | 1 j | user |
| Recherche (anonyme) | 120 | 1 min | IP |
| Export RGPD | 2 | 1 j | user |

Implémentation : **table Postgres `rate_limits` (sliding window) au lancement** — pas de dépendance externe. Bascule vers Upstash Redis différée à la montée en charge (décision d'architecture, chap. 0). Réponse 429 + Retry-After + clé `error_rate_limited`.

### 19.3 Messagerie — contraintes & résilience
- **Unicité conversation directe** : `direct_key = least(u1,u2)||'_'||greatest(u1,u2)`, UNIQUE. **Correction C (v12)** : la clé est CALCULÉE et posée en base par le trigger `enforce_direct_two_members` à partir des 2 membres réels — l'application ne peut pas poser une clé incohérente avec les membres.
- **Exactement 2 membres** : trigger `enforce_direct_two_members` (exception au-delà de 2 pour type='direct').
- **Blocage à l'envoi** : `messages_insert` vérifie qu'aucun membre n'a bloqué l'expéditeur.
- **Pièces jointes** : ≤ 5 par message, ≤ 5 Mo chacune (`check size_bytes`).
- **File d'envoi / offline** : messages hors-ligne en file côté client ; retry à la reconnexion ; fallback Realtime→polling (5/30/60 s).
- **T4 (dette MVP)** : l'accusé de lecture est **global par conversation** (`conversation_members.last_read_at`), pas par message. Accusé par message → Phase 2.

### 19.4 Notifications — orchestrateur
- **Worker** : Edge Function planifiée (cron ~1 min) consomme `notification_queue` (status='pending', scheduled_at<=now).
- **Envoi** : email via Resend (template selon type, Annexe E) ; statut dans `email_deliveries` ; in_app = insert `notifications`.
- **Déduplication** : clé (user_id, type, hash(payload)) ; groupage `new_message` (1 email/10 min/conversation).
- **Bounce / retry** : bounced → désactive emails non essentiels ; échec transitoire → retry exponentiel (max 5) puis 'failed'.

### 19.5 Recherche — spec
- **Alimentation** : triggers AFTER I/U/D (chap. 11) ; suppression à la dé-publication/expiration/passage privé/**soft-delete** (B3).
- **Pondération** : `setweight` A=title, B=content ; tri `ts_rank` combiné à la proximité géo (`ST_Distance`).
- **Autocomplétion** : préfixe sur `title` via `pg_trgm` + `unaccent` ; débouncée client, rate-limitée serveur.
- **Géo** : `ST_DWithin` (bounding box) + distance ; rayon paramétrable. **Offres incluses (T1)**.
- **Pagination** : keyset (curseur sur (rank, id)), pas d'OFFSET.
- **Reindex complet** : `rebuild_search_index()` vide et réalimente depuis les tables source.
- **Bascule Meilisearch** : si p95 > 200 ms sur 3 mesures consécutives.

### 19.6 Sécurité opérationnelle
- **CSP** : `default-src 'self'` ; `img-src 'self' data: {Storage}` ; `script-src 'self'` ; `style-src 'self' 'unsafe-inline'` ; `connect-src 'self' {Supabase}` (+ {Upstash} si adopté) ; `frame-ancestors 'none'`. + HSTS, X-Content-Type-Options:nosniff, Referrer-Policy:strict-origin-when-cross-origin.
- **Sanitization éditeur riche** : allow-list stricte (p, h2-h4, strong, em, ul/ol/li, a[href], blockquote, img[src,alt]) ; le reste retiré, serveur, avant stockage ET au rendu.
- **Validation Zod** : schémas serveur ; patterns (email RFC, slug `^[a-z0-9-]+$`, SIRET 14 chiffres, URL https) — référentiels Annexe G.
- **CSRF** : Server Actions protégées (origin check) ; jamais d'action mutative en GET.
- **Bot protection** : captcha léger sur inscription, contact, retrait (F-25) ; rate limits IP.
- **Step-up super_admin (T12)** : implémenté côté **middleware Next.js** (session applicative), pas en base ; re-auth requise avant changement de capacité critique ou suppression de masse.
- **Sessions** : durée courte + rotation du refresh token ; révocation forcée à la suspension.
- **Secrets & alerting** : variables d'env Vercel/Supabase, jamais commitées ; rotation documentée ; Sentry + alertes de seuil.

---

