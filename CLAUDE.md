# CLAUDE.md — ClubProprete.com

> Point d'entrée pour l'exécution agentique. Lis ce fichier en premier, puis charge à la demande le fichier `docs/` correspondant à ta tâche (index plus bas). La source de vérité complète reste `PRD_ClubProprete_v13_FINAL.md` ; les fichiers `docs/` en sont des vues thématiques, et `db/*.sql` en sont les artefacts exécutables.

---

## 1. Le projet en une page

**ClubProprete.com** — plateforme B2B **entièrement gratuite** pour l'écosystème de la propreté en France (« LinkedIn de la propreté »). Six facettes autour d'un cœur réseau : profils + graphe social, annuaire B2B, média/blog à rédaction communautaire, emploi, club associatif (sur candidature validée), back-office.

**Décisions fermes (ne jamais contredire) :**
- **Aucune monétisation** (pas d'abonnement, pas de mise en avant payante, pas de pub).
- **Aucune migration** (projet *from scratch*).
- **Autorisation 100 % par capacités** via `has_capability()` + RLS Postgres. **Aucun claim JWT `role`.** `main_role` sert au routing/identité, lu en base.
- **Messagerie 1-1 d'abord** ; groupes prévus dans le schéma mais activés en **Phase 3** seulement.
- **Modération livrée AVEC l'UGC** (jamais après).
- **Pas de table `leads`** : un contact ouvre une conversation + notification.
- **Rate limiting via Postgres (`rate_limits`) au lancement** ; Upstash/Redis différé à la montée en charge.
- **Produit FR-FR** ; microcopy centralisée par clés techniques (i18n réversible, pas de champ `locale`).
- **Référentiels métier centralisés** dans `docs/11-referentiels.md` (source unique des enums Zod).
- `SUPER_ADMIN_EMAILS = clement@pershingsolution.com`.

---

## 2. Stack technique

| Couche | Choix | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC) | Server Actions pour les mutations internes ; Route Handlers / Edge Functions pour le public/externe |
| Base + Auth + Storage + Realtime | **Supabase** (Postgres) | RLS activée sur les 46 tables ; Auth Hook custom pour injecter les capacités |
| Email | **Resend** | Templates React Email ; envoi via file `notification_queue` |
| Analytics | **Plausible** (sans cookies) + **PostHog** | Plausible par défaut ; PostHog sans cookies ou bannière conforme |
| Hébergement | **Vercel** | ISR + Edge |
| Rate limiting | **Postgres `rate_limits`** au lancement | Upstash différé |
| Agent de dev | **Claude Code** | Ce dépôt |

---

## 3. Conventions de code

**Général**
- TypeScript strict. Pas de `any` non justifié. Validation de toute entrée via **Zod** (schémas serveur ; patterns : email RFC, slug `^[a-z0-9-]+$`, SIRET 14 chiffres, URL https).
- Les enums Zod se génèrent depuis `docs/11-referentiels.md` — ne jamais coder une liste métier en dur ailleurs.

**Base de données / SQL**
- snake_case pour tables et colonnes. Les FK `→profiles` ciblent toujours `profiles.user_id` (PK = `user_id`, pas de colonne `id` sur profiles).
- Toute logique de sécurité passe par les **helpers `SECURITY DEFINER`** (`has_capability`, `is_entity_member`, `is_entity_owner`, `is_conversation_participant`, `is_blocked`, `recalc_entity_capabilities`). Ne jamais réécrire une policy avec une sous-requête inline sur la même table (risque de récursion RLS) : passer par un helper.
- **Jamais** l'opérateur jsonb `?` dans une policy (ambigu) : utiliser `has_capability()` (qui emploie `@>`).
- Tout `INSERT` en RLS a un `with check` explicite. Toute transition d'état est gardée serveur + journalisée (`audit_logs`).

**Frontend**
- RSC par défaut sur les pages publiques ; agrégations via RPC Postgres (anti N+1). ISR par tags. Pagination **keyset** (curseur), jamais OFFSET. TanStack Query uniquement pour l'interactif.
- **4 états UI obligatoires** sur chaque écran de données : vide / chargement (skeletons, layout stable) / erreur (message + reprise, jamais d'échec silencieux) / succès (feedback).
- Design system : voir `docs/09-design-system.md` (tokens couleurs WCAG AA, breakpoints sm 640 / md 768 / lg 1024 / xl 1280).
- Accessibilité WCAG 2.1 AA : contraste ≥ 4,5:1, cibles ≥ 44×44 px, navigation clavier + focus visible, `aria-live` pour les toasts.

**Sécurité (rappels, détail dans `docs/04-security-rls.md` et `docs/07-...`)**
- Sanitization serveur de l'éditeur riche (allow-list) avant stockage ET au rendu. CSP stricte. CSRF : Server Actions protégées, jamais de mutation en GET. Step-up auth super_admin côté middleware.

---

## 4. Workflow de développement attendu

**Phase 0 — Discovery (À FAIRE EN PREMIER)**
1. Provisionner un projet Supabase de test.
2. Exécuter dans l'ordre : `db/01_schema.sql` → `db/02_rls.sql` → `db/03_seed_test.sql` → `db/04_tests_pgtap.sql` (nécessite l'extension `pgtap`).
3. **Les 21 tests pgTAP doivent passer au vert.** Ils vérifient les scénarios critiques trouvés en audit : création d'entité de zéro, éditeur qui ne peut pas se promouvoir owner, candidat qui ne peut pas s'auto-embaucher, réindexation de la recherche, masquage des soft-deletes, upload de média d'entité. **Ne pas avancer tant que ce n'est pas vert.**
4. **Point à vérifier avant de câbler l'Auth (3C)** : le format de retour de `custom_access_token_hook` (dans `db/01_schema.sql`) doit être confirmé contre la doc Supabase Auth de la version installée. Une mauvaise structure bloque toute connexion. Tester réellement.

**Découpage en MVP-blocs** (détail : `docs/08-roadmap-tests.md`)
- **MVP 1** — Socle annuaire : auth, capacités, profils, fiches (4 types), annuaire + recherche, vérification, back-office minimal, seed (200 profils / 80 fiches dont 50 vérifiées).
- **MVP 2** — Contenu & modération : rédaction 3 piles, articles sur profil, ressources, notifications, modération (livrée avec l'UGC).
- **MVP 3** — Réseau & messagerie 1-1 (Realtime + fallback + blocage).
- **MVP 4** — Emploi & club : offres, candidatures, association, sous-traitance, groupes (Phase 3).

**Definition of Done par bloc :** tous les AC du bloc verts en E2E (Playwright) + tests RLS pgTAP ; non-fonctionnels (perf, a11y) verts ; 4 états UI présents ; aucune régression ; audit sécurité ciblé avant toute ouverture publique.

**Règle d'or de cohérence :** une seule vérité par sujet. Si tu modifies une décision de schéma ou de sécurité, mets à jour `db/*.sql` ET le `docs/` correspondant ET le PRD complet — jamais l'un sans les autres.

---

## 5. Index — quel fichier pour quelle tâche

| Ta tâche | Lis |
|---|---|
| Comprendre le produit, les personas, le périmètre | `docs/00-vision-personas.md` |
| Architecture, modules, rôles, matrice de permissions, capacités | `docs/01-architecture-roles.md` |
| Implémenter un parcours utilisateur (F-01→F-25) + critères d'acceptation | `docs/02-flows.md` |
| Créer/modifier une table, comprendre le modèle de données | `docs/03-data-model.md` + `db/01_schema.sql` |
| Écrire/déboguer une policy RLS, l'auth hook, le cycle des capacités | `docs/04-security-rls.md` + `db/02_rls.sql` |
| Construire un écran, une page, une fonctionnalité (score complétion, upload) | `docs/05-ux-pages.md` |
| Cache/perf, rate limiting, messagerie, recherche, notifications, clarifications modèle | `docs/06-ops-search-notif.md` |
| SEO/GEO, RGPD, coûts, sauvegarde | `docs/07-seo-rgpd-costs.md` |
| Machine à états, roadmap/DoD, risques, tests & AC complets | `docs/08-roadmap-tests.md` |
| Styliser un composant (couleurs, typo, états boutons) | `docs/09-design-system.md` |
| Router une page, définir des permissions de route, gérer un bucket Storage | `docs/10-routes-storage.md` |
| Valider une saisie métier (services, segments, contrats, familles fournisseurs) | `docs/11-referentiels.md` |
| Provisionner la base, lancer les tests | `db/*.sql` |
| Trancher un point ambigu / référence exhaustive | `PRD_ClubProprete_v13_FINAL.md` |

---

## 6. Questions ouvertes (Annexe F du PRD)

Une seule était bloquante (`SUPER_ADMIN_EMAILS`) — **résolue** : `clement@pershingsolution.com`. Les autres ont un défaut raisonnable (catégories d'articles figées puis administrables ; profils candidats privés par défaut ; purge PII à 30 j ; seuil Meilisearch p95 > 200 ms ; liste noire modération à constituer avant l'UGC). Aucune ne bloque le démarrage.

---

## 7. Réserve importante (à lire)

Le SQL de ce dépôt a été **vérifié structurellement** (parsing, intégrité des FK, équilibrage, exhaustivité RLS) mais **jamais exécuté contre un vrai Postgres + PostGIS** au moment de la rédaction. Plusieurs audits successifs ont trouvé des bugs de logique d'exécution (deadlocks RLS, désynchronisation d'index, blocages de policy) que seule l'exécution révèle. **Le tout premier geste doit être de lancer `db/01→04` sur un Supabase de test et de faire passer les 21 tests pgTAP.** C'est là, et seulement là, que « vérifié » devient « exécuté ». Ne considère pas le schéma comme définitif avant ce vert.
