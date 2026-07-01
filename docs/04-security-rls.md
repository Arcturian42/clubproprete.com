# Sécurité — RLS, Auth Hook & capacités

> Extrait du PRD ClubProprete.com v13 — chap. 12, 13, 16, 17. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.
>
> Les policies exécutables sont dans `../db/02_rls.sql`. Ce fichier explique la logique.

---

## 12. Sécurité — RLS (capacités uniquement, SQL complet)

RLS activée sur les 46 tables. Autorisation 100 % par capacités via `has_capability(text)` ; **aucun claim `role`** ; l'opérateur jsonb ambigu `?` n'est jamais utilisé. Les helpers `SECURITY DEFINER` (chap. 11) évitent la récursion. Tout INSERT a un `with check` explicite.

**Helpers utilisés** : `has_capability`, `is_entity_member`, `is_entity_owner`, `is_conversation_participant`, `is_blocked`, `recalc_entity_capabilities`.

### 12.1 Activation RLS & policies (SQL complet)

> B4 : la policy `messages_update` autorise `auth.uid() = sender_id OR has_capability('moderate')` (le modérateur peut flagger).

> **Corrections d'exécution v11** : `entities` — INSERT séparé du UPDATE/DELETE pour lever le deadlock de création (1A) ; `entity_members` — auto-attribution du premier owner autorisée (1B) et trigger `guard_member_role` empêchant un editor de se promouvoir owner (2A) ; `connections` — seul le destinataire accepte (2B) ; `mission_applications` — recruteur gère le statut, candidat limité à `withdrawn` (2C). `has_capability` utilise l'opérateur de confinement `@>` (3A).

> **À vérifier avant exécution (3C)** : le format de retour de `custom_access_token_hook` (`jsonb_set(event,'{claims,capabilities}',caps)`) doit être confirmé contre la doc Supabase Auth à jour ; une variante `jsonb_build_object('claims', ...)` existe selon la version de l'API des hooks. À valider par un test réel, non tranché ici.

> **RLS complètes → `../db/02_rls.sql`** (46 tables, helpers, aucun claim role, opérateur `?` proscrit).


### 12.2 Tables service-role (deny par défaut)

`slug_history`, `email_deliveries`, `notification_queue`, `rate_limits` ont la RLS activée **sans aucune policy permissive** : tout accès client est refusé ; seul le service role (Edge Functions / triggers) y accède. Volontaire — couvre l'exhaustivité des 46 tables.

---

## 13. Mécanisme d'autorisation — Auth Hook & fraîcheur des capacités

Spécifie comment les capacités de `user_capabilities` arrivent dans le JWT, et comment une décision admin prend effet « sans reconnexion ».

### 13.1 Custom Access Token Hook

Supabase ne place pas automatiquement une table custom dans le JWT. Un **Custom Access Token Hook** (fonction Postgres déclarée comme hook d'authentification) injecte le claim `capabilities` à chaque émission/rafraîchissement de token.

> **RLS complètes → `../db/02_rls.sql`** (46 tables, helpers, aucun claim role, opérateur `?` proscrit).


- **Lecture en RLS** : `has_capability(cap)` lit `auth.jwt() -> 'capabilities'` via `jsonb_array_elements_text` (jamais l'opérateur `?`).
- **Source unique** : le module d'accès applicatif lit le même array ; `user_capabilities` reste l'autorité, le JWT n'en est qu'un miroir signé.

### 13.2 Fraîcheur des capacités (élévation « sans reconnexion »)

| Situation | Mécanisme | Effet |
|---|---|---|
| Décision admin (vérif./adhésion/rédacteur approuvés) | Écriture `user_capabilities` (ou `recalc_entity_capabilities`) → notification Realtime sur canal privé | Le client appelle `supabase.auth.refreshSession()` → nouveau JWT |
| Utilisateur hors-ligne | Rien à forcer ; le hook recalcule au prochain login/refresh | Capacité présente dès la session suivante |
| Révocation / suspension | `revoked_at` + révocation de session | Accès retiré au plus tard au prochain refresh ; immédiat si session révoquée |
| Défense en profondeur | Les actions sensibles re-vérifient `user_capabilities` en base | Pas de fenêtre d'abus |

---


## 16. RLS — couverture nominale des 46 tables (checklist)

Politique de chacune des 46 tables, une ligne par table. Vérifiée en CI (un test échoue si une table du schéma n'a pas de policy ou de justification service-role).

| # | Table | Politique (résumé) |
|---|---|---|
| 1 | profiles | SELECT public si visibility=public sinon own ; moderate. UPDATE own/moderate. INSERT trigger. |
| 2 | user_capabilities | SELECT own/admin_panel. Écriture admin_panel. Lue par le hook (supabase_auth_admin). |
| 3 | skills | SELECT public. Écriture admin_panel. |
| 4 | profile_skills | SELECT public. Écriture own. |
| 5 | entities | SELECT active/member/moderate. INSERT tout authentifié (1A). UPDATE/DELETE member/moderate. |
| 6 | companies | SELECT via entities. Écriture member/moderate. |
| 7 | suppliers | SELECT via entities. Écriture member/moderate. |
| 8 | training_orgs | SELECT via entities. Écriture member/moderate. |
| 9 | independents | SELECT via entities. Écriture member/moderate. |
| 10 | company_services | SELECT via entities active. Écriture member/moderate. |
| 11 | entity_members | SELECT own/member/moderate. INSERT owner OU auto-owner 1er membre (1B). UPDATE owner/own + trigger guard rôle (2A). DELETE owner/moderate. |
| 12 | verification_requests | SELECT member/moderate. INSERT member. UPDATE moderate. |
| 13 | claim_requests | SELECT own/moderate. INSERT own. UPDATE moderate. |
| 14 | entity_removal_requests | SELECT moderate. INSERT public (anti-bot). UPDATE moderate. |
| 15 | article_categories | SELECT public. Écriture admin_panel. |
| 16 | articles | SELECT published **et non soft-deleté (B)**/own/moderate. INSERT write_article+own. UPDATE own(draft/rejected)/moderate. DELETE own(draft)/moderate. |
| 17 | author_applications | SELECT own/moderate. INSERT own. UPDATE moderate. |
| 18 | jobs | SELECT published **et non soft-deleté (B)**/member/moderate. INSERT publish_job+member. UPDATE member/moderate. |
| 19 | job_applications | SELECT candidat/recruteur/moderate. INSERT candidat. UPDATE candidat/recruteur. |
| 20 | job_alerts | ALL own. |
| 21 | association_memberships | SELECT own/moderate. INSERT own. UPDATE moderate. |
| 22 | missions | SELECT access_subcontracting **(non soft-deleté, B)**/créateur/moderate. INSERT publish_mission. UPDATE créateur/moderate. |
| 23 | mission_applications | SELECT candidat/créateur/moderate. INSERT candidat+access_subcontracting. UPDATE : recruteur (statut) / candidat (withdrawn uniquement) (2C). |
| 24 | connections | SELECT concernés/profil public. INSERT from+not blocked. UPDATE : destinataire uniquement (2B). DELETE concernés. |
| 25 | follows | SELECT concernés/profil public. Écriture from+not blocked. |
| 26 | recommendations | SELECT public(cible)/concernés/moderate. INSERT from+not blocked. UPDATE/DELETE from/moderate. |
| 27 | conversations | SELECT participant. INSERT créateur. UPDATE participant. |
| 28 | conversation_members | SELECT participant. INSERT participant/own. UPDATE own. |
| 29 | messages | SELECT participant non bloqué **et non soft-deleté (B)** OR (moderate & flagged). INSERT sender+participant+not blocked. UPDATE own OR moderate (B4). |
| 30 | message_attachments | SELECT participants. INSERT expéditeur. DELETE expéditeur. |
| 31 | blocks | SELECT blocker own. Écriture blocker own. |
| 32 | notifications | SELECT own. UPDATE own(read_at). INSERT service role. |
| 33 | notification_preferences | ALL own. |
| 34 | reports | SELECT reporter/moderate. INSERT own. UPDATE moderate. |
| 35 | moderation_decisions | SELECT moderate. INSERT moderate. Immuable. |
| 36 | media | SELECT public. Écriture : moderate OU profil own OU membre d'entité (owner_type='entity') OU auteur d'article (point 2, v13). |
| 37 | audit_logs | SELECT admin_panel. INSERT service role. Immuable. |
| 38 | resources | SELECT published/admin_panel. Écriture admin_panel. |
| 39 | resource_downloads | INSERT public (gating email). SELECT admin_panel/own. |
| 40 | search_index | SELECT public. Écriture triggers (service). |
| 41 | seo_metadata | SELECT public. Écriture admin_panel. |
| 42 | slug_history | Service role uniquement (deny par défaut côté client). |
| 43 | email_deliveries | Service role uniquement. |
| 44 | notification_queue | Service role uniquement. |
| 45 | rate_limits | Service role uniquement. |
| 46 | user_sessions | SELECT own/admin_panel. Écriture service role. |

> Les 46 tables ont chacune leur ligne. Tables 42–45 : strictement service-role (RLS active, aucune policy = deny client).

---

## 17. Capacités — cycle de vie & gates produit

### 17.1 Gates (utilisées dans les policies RLS)

| Capacité | Gate RLS ? | Effet |
|---|---|---|
| `write_article` | OUI | articles_insert : nécessaire pour créer un article |
| `publish_job` | OUI | jobs_insert : nécessaire (+ entité vérifiée) pour publier une offre |
| `publish_mission` | OUI | missions_insert : créer une mission de sous-traitance |
| `access_subcontracting` | OUI | missions_read + mission_applications_insert |
| `moderate` | OUI | bypass modération sur ~20 tables ; flagging des messages (B4) |
| `admin_panel` | OUI | back-office, gestion capacités/catégories/SEO, lecture audit |
| `send_message / connect / follow / recommend` | NON (implicite) | Actions ouvertes à tout authentifié ; gate = participation/propriété/blocage. Non stockées (pas de capacité décorative). |

> **Décision tranchée** : `send_message`, `connect`, `follow`, `recommend` ne sont pas stockées dans `user_capabilities`. Capacités réellement stockées : `write_article`, `publish_job`, `publish_mission`, `access_subcontracting`, `moderate`, `admin_panel`.

### 17.2 Pose / retrait par événement

| Événement | Capacités posées | Capacités retirées |
|---|---|---|
| Inscription | (aucune — actions de base ouvertes par RLS) | — |
| Entité passée `verified=true` | `publish_job` (via `recalc_entity_capabilities`) | — |
| Adhésion association approuvée | `access_subcontracting`, `publish_mission` | — |
| Candidature rédacteur approuvée | `write_article` | — |
| Nomination admin/super_admin | `moderate`, `admin_panel` | — |
| Suspension utilisateur | — | write_article, publish_job, publish_mission, access_subcontracting |
| Perte de vérification / retrait d'entité | — | `publish_job` si plus aucune entité vérifiée (**`recalc_entity_capabilities`**, B5) |
| Révocation adhésion | — | access_subcontracting, publish_mission |

### 17.3 `recalc_entity_capabilities` (B5)

Fonction `SECURITY DEFINER` (chap. 11) appelée par **F-06** (rejet/perte de vérification), **F-19** (retrait d'entité) et **F-25** (retrait de fiche tierce). Elle vérifie si l'utilisateur a encore au moins une entité vérifiée active ; si non, pose `revoked_at = now()` sur `publish_job` ; sinon (ré)active la capacité. Chaque appel écrit une entrée `audit_logs`.

### 17.4 Cycle `granted_at` / `revoked_at` & limite d'historique

- Pose : insert `(user_id, capability, source, granted_at)`. Retrait : update `revoked_at = now()` (on ne supprime pas la ligne).
- **Limite assumée** : la PK `(user_id, capability)` empêche de conserver plusieurs cycles successifs. À une re-pose, `revoked_at` repasse à NULL et `granted_at`/`source` sont mis à jour.
- **Compensation** : chaque pose/retrait écrit dans `audit_logs` (action `capability_grant`/`capability_revoke`/`recalc_capabilities`) — l'historique complet y est traçable.
- **Hook JWT** : le claim `capabilities` agrège les capacités où `revoked_at is null` (chap. 13).

### 17.5 `publish_job` conditionnelle, groupes, i18n, Mermaid

- **publish_job** : accordée seulement si l'entité employeur est vérifiée (cohérence 5.1↔5.2) ; recalculée par `recalc_entity_capabilities`.
- **Modération de groupe (Phase 3)** : un message de groupe signalé pose `flagged=true` ; lecture modération identique. `hide` masque pour tous ; warn/suspend/ban visent l'auteur.
- **i18n** : produit FR-FR ; microcopy par clés techniques (réversible) ; pas de champ `locale`.
- **Mermaid** : code ASCII littéral (connecteurs `||--o{`), copier-coller compatible.

---
