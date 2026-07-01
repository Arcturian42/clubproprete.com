# Modèle de données

> Extrait du PRD ClubProprete.com v13 — chap. 11 (commenté) + chap. 14 (clarifications). Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.
>
> Le SQL exécutable complet est dans `../db/01_schema.sql`. Ce fichier en est la vue commentée.

---

## 11. Modèle de données (source unique, SQL complet)

Postgres / Supabase, snake_case. Unique schéma du document. **46 tables** : 39 fonctionnelles + 7 d'infrastructure. `profiles` a pour PK `user_id` (référence `auth.users`) ; toutes les FK « →profiles » ciblent `profiles.user_id`. Le SQL ci-dessous est la migration Phase 0 (regroupée exécutable en Annexe A).

### 11.1 Liste nominale des 46 tables

| # | Table | # | Table |
|---|---|---|---|
| 1 | profiles | 24 | connections |
| 2 | user_capabilities | 25 | follows |
| 3 | skills | 26 | recommendations |
| 4 | profile_skills | 27 | conversations |
| 5 | entities | 28 | conversation_members |
| 6 | companies | 29 | messages |
| 7 | suppliers | 30 | message_attachments |
| 8 | training_orgs | 31 | blocks |
| 9 | independents | 32 | notifications |
| 10 | company_services | 33 | notification_preferences |
| 11 | entity_members | 34 | reports |
| 12 | verification_requests | 35 | moderation_decisions |
| 13 | claim_requests | 36 | media |
| 14 | entity_removal_requests | 37 | audit_logs |
| 15 | article_categories | 38 | resources (M09) |
| 16 | articles | 39 | resource_downloads (M09) |
| 17 | author_applications | 40 | search_index (infra) |
| 18 | jobs | 41 | seo_metadata (infra) |
| 19 | job_applications | 42 | slug_history (infra) |
| 20 | job_alerts | 43 | email_deliveries (infra) |
| 21 | association_memberships | 44 | notification_queue (infra) |
| 22 | missions | 45 | rate_limits (infra) |
| 23 | mission_applications | 46 | user_sessions (infra) |

> **Décisions tranchées (modèle)** : pas de table `leads` (F-24) ; ressources conservées (M09) ; centres en texte libre (`programs_text`).

### 11.2 SQL — extensions, énums, helpers, tables 1–23 (avec triggers)

Extensions requises : `pgcrypto`, `postgis`, `pg_trgm`, `unaccent`. Suivent les énums, les 6 fonctions helper `SECURITY DEFINER` (dont `recalc_entity_capabilities` — B5), le trigger générique `updated_at`, le trigger de création de profil au signup, puis les tables 1 à 23.

> **SQL complet → `../db/01_schema.sql`** (extensions, énums, 6 helpers SECURITY DEFINER, 46 tables, triggers). Exécuter en premier.


### 11.3 SQL — tables 24–46, contraintes messagerie & triggers search_index

Inclut : l'unicité de conversation directe (`direct_key`) + le trigger « exactement 2 membres » ; la limite 5 Mo par pièce jointe ; et les triggers d'alimentation de `search_index` (entities/profiles/articles/jobs) avec suppression à la dé-publication **et au soft-delete** (B3) et alimentation géo des offres (T1).

> **SQL complet → `../db/01_schema.sql`** (extensions, énums, 6 helpers SECURITY DEFINER, 46 tables, triggers). Exécuter en premier.


### 11.4 Conventions

- Soft-delete (`deleted_at`) sur profiles, entities, articles, jobs, missions, messages — masquage RGPD ; les triggers `search_index` retirent l'élément dès `deleted_at is not null` (B3).
- `updated_at` automatique (trigger) sur les tables éditables ; index sur (type,status,verified), insee_code, slug, messages(conversation_id, created_at).
- Anti-doublon : UNIQUE sur candidatures emploi/missions, connexions, follows, services, `direct_key`.

---

