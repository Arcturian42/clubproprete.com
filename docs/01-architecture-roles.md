# Architecture, rôles & capacités

> Extrait du PRD ClubProprete.com v13 — chap. 4 à 5 + 17 (cycle de vie des capacités). Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.
>
> Le détail des policies RLS est dans 04-security-rls.md.

---

## 4. Architecture & modules

```
PUBLIC (non connecté) : Accueil · Annuaires · Profils publics · Blog · Emploi · Formations · Association · Recherche
        │ Supabase Auth (email + OAuth) → Onboarding wizard → entité(s) + capacités
        ▼
ESPACE MEMBRE (/espace)                  BACK-OFFICE (/admin)
  nav latérale persistante :               CRM admin / super_admin :
  Mon profil · Mon réseau · Messages       Vue d'ensemble · Utilisateurs & capacités
  Ma/Mes fiche(s) + switcher               Entités · Demandes (vérif/adhésion/
  Espace rédaction (3 piles)               rédacteur/claim/retrait)
  Mes offres / candidatures                Modération & signalements
  Sous-traitance (membre) · Paramètres     Blog · Audit · Paramètres
```

| # | Module | Détail |
|---|---|---|
| M01 | Site public + SEO/AEO/GEO | Accueil, institutionnel, FAQ schema, pages géolocalisées |
| M02 | Auth (Supabase) + compte | Email + OAuth, reset, suppression RGPD, sessions |
| M03 | Onboarding wizard par situation | Branché, ville/SIRET/tags, cumul, reprise |
| M04 | Profils publics (type LinkedIn) | Header, compétences, entités, recommandations, publications |
| M05 | Annuaire entités + recherche | Sociétés, fournisseurs, centres, indépendants ; filtres service+géo |
| M06 | Graphe social | Connexions, suivi, recommandations |
| M07 | Messagerie temps réel | 1-1 (groupes en Phase 3) — Supabase Realtime |
| M08 | Média / blog + espace rédaction | Candidature ouverte, 3 piles, articles sur le profil |
| M09 | Ressources téléchargeables | Modèles, checklists ; gating email |
| M10 | Emploi | Offres, candidatures, alertes, expiration |
| M11 | Association (sur candidature) | Adhésion gratuite validée, badge, privé |
| M12 | Sous-traitance privée | Missions réservées membres, candidatures |
| M13 | Modération & signalements | Files, décisions tracées, machine à états |
| M14 | Notifications | In-app + email + préférences + file fiable |
| M15 | Back-office admin / super admin | CRM complet, audit, paramètres |
| M16 | Recherche globale | Cross-module via search_index, autocomplétion, filtres |
| M17 | Analytics & audit | KPI + journal d'audit |
| M18 | Paramètres & RGPD | Sécurité, notifications, export/suppression |

---

## 5. Rôles, capacités & permissions

Supabase Auth gère l'authentification. L'autorisation repose exclusivement sur des **capacités** : la table `user_capabilities` alimente un claim JWT `capabilities` (array), lu identiquement par le module d'accès applicatif et par les RLS via `has_capability()`. **Aucun claim `role`** : `main_role` sert au routing/identité et est lu en base.

### 5.1 Identité & capacités

- Rôles d'identité (`profiles.main_role`, contrainte `check`) : registered_user, company_owner, verified_company, supplier_owner, verified_supplier, training_org_owner, verified_training_org, independent, verified_independent, candidate, author, admin, super_admin.
- `association_member` est un **statut** dérivé de la table d'adhésion, pas un rôle.
- **Capacités stockées** : `write_article`, `publish_job`, `publish_mission`, `access_subcontracting`, `moderate`, `admin_panel`. (cf. chap. 17 pour les gates implicites)
- **Super admin** : emails lus depuis `SUPER_ADMIN_EMAILS` (valeur confirmée : `clement@pershingsolution.com`) ; élévation idempotente au démarrage et au login (pose `moderate` + `admin_panel`).
- **Cumul** : un utilisateur peut détenir plusieurs entités et capacités simultanément.

### 5.2 Matrice rôles × permissions (extrait)

✔ autorisé · — interdit · (val) validation requise · C/M/S créer/modifier/supprimer.

| Action / Rôle | Visit. | Inscrit | Entr. vérif. | Fourn./Centre | Indép. | Cand. | Réd. | Admin | S.admin |
|---|---|---|---|---|---|---|---|---|---|
| Voir pages & fiches publiques | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Profil public + publications | ✔(lect.) | C/M | C/M | C/M | C/M | C/M | C/M | M | M |
| Créer/éditer sa fiche entité | — | C | C/M | C/M | C/M | — | — | M tout | M tout |
| Demander vérification fiche | — | — | C(val) | C(val) | C(val) | — | — | ✔ | ✔ |
| Connexion / suivi / recommandation | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Messagerie temps réel | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Candidater rédacteur | — | C(val) | C(val) | C(val) | C(val) | C(val) | déjà | ✔ | ✔ |
| Écrire / publier un article | — | — | — | — | — | — | C/M(val) | M/S | M/S |
| Publier une offre d'emploi | — | — | C(vérif.) | — | — | — | — | C/M/S | C/M/S |
| Postuler à une offre | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| Candidater à l'association | — | C(val) | C(val) | C(val) | C(val) | C(val) | C(val) | ✔ | ✔ |
| Accès sous-traitance (membre) | — | — | memb. | memb. | memb. | — | — | ✔ | ✔ |
| Modérer contenus & entités | — | — | — | — | — | — | — | ✔ | ✔ |
| Gérer capacités & paramètres | — | — | — | — | — | — | — | (part.) | ✔ |

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
