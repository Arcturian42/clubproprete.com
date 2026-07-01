# Machine à états, roadmap, risques & tests

> Extrait du PRD ClubProprete.com v13 — chap. 18, 22, 23, 24. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.
>
> Les tests pgTAP exécutables sont dans `../db/04_tests_pgtap.sql`.

---

## 18. Machine à états (état par état)

Chaque transition est gardée côté serveur (capacité + RLS) et journalisée (`audit_logs`).

### Entité (`entities.status` + `verified`)
| De | Vers | Déclencheur (qui) |
|---|---|---|
| (création) | active | owner (création de fiche) |
| active | active + verified=true | cap:moderate (approbation vérification) |
| active | suspended | cap:moderate (modération) |
| suspended | active | cap:moderate (levée) |
| active / suspended | archived | owner (soft-delete) ou cap:moderate (+ recalc_entity_capabilities) |

### Vérification (`verification_requests.status`)
| De | Vers | Déclencheur (qui) |
|---|---|---|
| draft | pending | owner (envoi) |
| pending | approved | cap:moderate (+ verified=true + recalc_entity_capabilities) |
| pending | rejected | cap:moderate (motif ; recalc_entity_capabilities) |

### Article (`articles.status`)
| De | Vers | Déclencheur (qui) |
|---|---|---|
| draft | pending | auteur (image requise) |
| pending | published | cap:moderate |
| pending | rejected | cap:moderate (motif) |
| rejected | draft | auteur (corriger) |
| published | archived | auteur ou cap:moderate |
| published | (révision) | auteur → article enfant (parent_article_id) |

### Offre (`jobs.status`)
| De | Vers | Déclencheur (qui) |
|---|---|---|
| draft | published | cap:publish_job (auto si entité vérifiée) |
| published | closed | recruteur |
| published / closed | archived | auto à expires_at ou recruteur |
| closed | published | recruteur (réouverture) |

### Candidature (`job_applications` / `mission_applications.status`)
| De | Vers | Déclencheur (qui) |
|---|---|---|
| submitted | viewed | recruteur |
| viewed | interview | recruteur |
| interview | hired | rejected | recruteur |
| submitted/viewed/interview | withdrawn | candidat |

### Demandes & signalement
| De | Vers | Déclencheur (qui) |
|---|---|---|
| association_memberships | pending → approved | rejected ; approved → revoked | cap:moderate |
| author_applications | pending → approved (+ write_article) | rejected | cap:moderate |
| claim_requests | pending → approved (rattachement) | rejected | cap:moderate |
| entity_removal_requests | open → approved (archivage + recalc) | rejected | cap:moderate |
| reports | open → dismissed | actioned (→ moderation_decision) | cap:moderate |

---


## 22. Roadmap (MVP-blocs, solo + Claude Code) & Definition of Done

Découpage en MVP-blocs livrables, estimations revues à la hausse (+50 %). DoD bloquante par bloc ; scope figé. Modération livrée AVEC l'UGC.

| Bloc | Effort (revu) | Contenu | DoD (sortie) |
|---|---|---|---|
| Phase 0 — Discovery | ~1-2 sem. | Annexe A (schéma + RLS) exécutée ; helpers + Auth Hook ; seed plan ; CI (Playwright + pgTAP) | Migrations + seed exécutables ; tests RLS pgTAP au vert ; hook capabilities fonctionnel |
| MVP 1 — Socle annuaire | ~6-9 sem. | Auth, capacités, /espace, profils, fiches (4 types), annuaire + search_index, vérification, back-office minimal, seed (200/80/50) | AC MVP1 verts (E2E + RLS) ; Lighthouse a11y/perf > 90 ; 200 profils / 80 fiches dont 50 vérifiées |
| MVP 2 — Contenu & modération | ~5-8 sem. | Espace rédaction (3 piles), articles sur profil, ressources (M09), notifications (queue + Resend), modération (signalement + flagging + auto-hide + file) | AC MVP2 verts ; modération opérationnelle AVANT ouverture UGC ; 20 articles seed |
| MVP 3 — Réseau & messagerie | ~5-8 sem. | Connexions/suivi/reco, messagerie 1-1 (Realtime + fallback + pièces jointes + blocage), centre de notifications | AC MVP3 verts ; tests négatifs messagerie (RLS, blocage, unicité directe) |
| MVP 4 — Emploi & club | ~6-9 sem. | Offres (slug, géo, expiration), candidatures + suivi, alertes, association, sous-traitance, messagerie de groupe (Phase 3) | AC MVP4 verts ; SEO programmatique géo en place |
| Post-MVP — Intelligence | à déclencher | Matching, scoring, enrichissement, autorité GEO | Déclenché si qualité taxonomie > seuil |

**DoD générique par bloc** : tous les AC verts (E2E Playwright + pgTAP) ; non-fonctionnels (perf, a11y, charge) verts ; 4 états UI + wireframes mobile revus ; aucune régression ; audit sécurité ciblé avant ouverture publique.

---

## 23. Risques

| ID | Risque | Prob. | Impact | Mitigation & owner |
|---|---|---|---|---|
| R1 | Effet réseau vide au lancement | Élevée | 🟠 | Seed chiffré (200/80/50) + preuve sociale. Owner : produit |
| R2 | Cohérence RLS ↔ module d'accès | Moyenne | 🔴 | Source unique = capacités (has_capability) ; non-régression à chaque PR. Owner : dev |
| R3 | Modération solo saturée | Moyenne | 🟠 | Auto-modération + récidive auto + file plafonnée. Owner : produit |
| R4 | Realtime saturé | Moyenne | 🟠 | Fallback polling + file + canaux sobres (chap. 19). Owner : dev |
| R5 | Recherche lente | Moyenne | 🟠 | search_index GIN/GiST ; Meilisearch si p95 > 200 ms. Owner : dev |
| R6 | Périmètre = délai non maîtrisé | Élevée | 🟠 | Roadmap MVP-blocs + freeze de scope (chap. 22). Owner : produit |
| R7 | RGPD / fiches tierces | Moyenne | 🟠 | F-25 + anonymisation + validation juridique (chap. 21bis). Owner : produit |
| R8 | XSS via éditeur riche | Moyenne | 🟠 | Sanitization serveur (allow-list) + CSP (19.6). Owner : dev |
| R9 | Coûts infra imprévus | Moyenne | 🟡 | Alertes de seuil + fallback Realtime. Owner : dev |
| R10 | Récursion RLS | Faible | 🔴 | Helpers SECURITY DEFINER — résolu par conception. Owner : dev |

---

## 24. Tests & qualité — critères d'acceptation complets

3 à 5 AC par flow (Given/When/Then), incluant des tests **négatifs** (RLS refuse). ~90 AC. Chaque AC mappé à un `.spec.ts` (Playwright) et, pour les RLS, à un test pgTAP.

### F-01 — Inscription & onboarding
| AC | Given / When / Then |
|---|---|
| 01.1 | Given un visiteur / When il s'inscrit (email) / Then un profil est créé (trigger) avec slug unique et main_role='registered_user'. |
| 01.2 | Given l'étape ville / When il choisit Lyon / Then insee_code, postal_code, region, lat, lng non NULL. |
| 01.3 | Given un company_owner existant / When il repasse le wizard / Then main_role jamais rétrogradé. |
| 01.4 | Given deux situations cochées / When il termine / Then deux entités créées et liées via entity_members. |
| 01.5 (neg) | Given un email déjà utilisé / When il s'inscrit / Then erreur explicite, pas de second profil. |

### F-02 / F-03 — Connexion, reset
| AC | Given / When / Then |
|---|---|
| 02.1 | Given email = clement@pershingsolution.com (∈ SUPER_ADMIN_EMAILS) / When connexion / Then moderate+admin_panel dans le JWT, routage /admin. |
| 02.2 (neg) | Given mauvais mot de passe ×5 / When 6e tentative / Then verrou temporaire. |
| 03.1 | Given un email inconnu / When demande de reset / Then réponse neutre, aucun email. |
| 03.2 | Given un lien de reset utilisé / When réutilisé / Then refus (usage unique). |

### F-05 / F-06 — Fiche & vérification
| AC | Given / When / Then |
|---|---|
| 05.1 | Given un owner / When il crée une fiche / Then entité active, profil intact. |
| 05.2 (neg) | Given un non-membre / When il PATCH l'entité via API / Then RLS refuse (403). |
| 05.3 (neg) | Given un service hors référentiel / When soumis via API / Then rejet serveur (Annexe G). |
| 06.1 | Given une demande de vérif. / When admin approuve / Then verified=true et publish_job posée (recalc), sans reconnexion. |
| 06.2 (neg) | Given une entité dont la vérif. est rejetée / When recalc s'exécute / Then publish_job révoquée si plus aucune entité vérifiée (B5). |

### F-12 / F-13 / F-17 — Rédaction
| AC | Given / When / Then |
|---|---|
| 12.1 | Given tout user connecté / When il candidate rédacteur / Then author_application pending créée. |
| 12.2 (neg) | Given un user sans write_article / When il POST un article via API / Then RLS refuse (403). |
| 12.3 | Given un rédacteur approuvé / When il ouvre l'espace / Then 3 piles. |
| 13.1 | Given un article validé / When published / Then il apparaît sur le profil. |
| 13.2 | Given un article publié / When soft-deleted / Then retiré de search_index (B3). |
| 17.1 | Given un article publié / When l'auteur l'édite / Then révision créée, original en ligne jusqu'à validation. |

### F-14 / F-25 — Modération & retrait
| AC | Given / When / Then |
|---|---|
| 14.1 | Given un message à signaler / When un modérateur pose flagged=true / Then l'update réussit (B4). |
| 14.2 | Given un message flaggé / When le modérateur le lit / Then accès autorisé UNIQUEMENT au message flaggé. |
| 14.3 (neg) | Given un modérateur / When il lit un message NON signalé d'une conversation tierce / Then RLS refuse. |
| 14.4 | Given 3 signalements validés sur un user / When le 3e est traité / Then suspension auto 24 h. |
| 25.1 | Given une fiche tierce / When le retrait est approuvé / Then entité archivée, retirée de search_index, recalc des membres. |

### F-15 — Messagerie 1-1
| AC | Given / When / Then |
|---|---|
| 15.1 | Given A et B (en ligne) / When A envoie / Then B reçoit en temps réel ; accusés mis à jour. |
| 15.2 (neg) | Given un non-participant / When il lit la conversation via API / Then RLS refuse. |
| 15.3 (neg) | Given B a bloqué A / When A tente d'écrire à B / Then messages_insert refuse. |
| 15.4 | Given B hors-ligne / When A envoie / Then notification créée ; message visible à la reconnexion. |
| 15.5 (neg) | Given une conversation directe A-B / When on tente d'en créer une seconde / Then UNIQUE(direct_key) refuse. |

### F-04 / F-20 — RGPD
| AC | Given / When / Then |
|---|---|
| 04.1 | Given un compte avec messages / When suppression / Then PII anonymisées, fiche retirée, messages conservés pour le destinataire. |
| 04.2 | Given suppression / When effectuée / Then avatars/cv/proofs/exports purgés du Storage. |
| 20.1 | Given une demande d'export / When traitée / Then JSON complet via lien signé (notification gdpr_export_ready). |

### F-10 / F-18 / F-11 — Emploi & association
| AC | Given / When / Then |
|---|---|
| 10.1 | Given une entité vérifiée / When elle publie une offre / Then visible sous /emploi/{slug} (B1) + alertes. |
| 10.2 (neg) | Given une entité NON vérifiée / When elle tente de publier / Then RLS refuse (publish_job absente). |
| 10.3 | Given une offre géolocalisée / When recherche par zone / Then l'offre remonte (geo_point alimenté, T1). |
| 18.1 | Given une offre / When expires_at atteint ou soft-delete / Then retirée de /emploi et de search_index (B3). |
| 11.1 | Given une candidature d'adhésion / When admin approuve / Then access_subcontracting posée, sous-traitance débloquée. |

### F-21 / F-16 / F-24 — Multi-entités, partage, contact
| AC | Given / When / Then |
|---|---|
| 21.1 | Given un user mono-entité / When il ajoute une activité / Then 2e entité créée, switcher persisté (current_entity_id, T5), main_role inchangé. |
| 16.1 | Given un article / When on le partage / Then URL canonique + carte OG correcte. |
| 24.1 | Given un visiteur sur une fiche / When il contacte / Then conversation + notification créées (aucune table leads). |

**Stratégie** : E2E Playwright par parcours ; RLS par pgTAP (négatifs) ; charge k6 (recherche p95 < 200 ms ; messagerie < 150 ms) ; a11y axe-core + Lighthouse > 90 ; sécurité Dependabot + pentest ciblé avant ouverture.

---

