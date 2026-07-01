# Flows utilisateurs F-01 → F-25

> Extrait du PRD ClubProprete.com v13 — chap. 7 (avec critères d'acceptation) + chap. 24 (AC complets). Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## 7. Flows utilisateurs (catalogue unique F-01 → F-25)

Chaque flow : objectif, étapes, critères d'acceptation. Catalogue complet et sans collision. Les flows impactés par l'audit v10 sont annotés.

### F-01 — Inscription & onboarding par situation

**Objectif :** Convertir un visiteur en profil propre, branché selon la/les situation(s).

> T8 (dette MVP) : la reprise de l'onboarding s'appuie sur l'état des entités déjà créées. Si l'utilisateur s'arrête avant la création d'entité, il recommence à l'étape 1 — acceptable pour le MVP (pas de table `onboarding_state`).

**Étapes :**
1. Inscription Supabase Auth (email ou OAuth) + email de confirmation (CTA renvoyer si non cliqué).
2. Étape Contact : ville autocomplétée → INSEE+CP+région+lat/lng (jamais NULL).
3. Étape Situation(s) : cases MULTIPLES possibles (société, fournisseur, centre, indépendant, demandeur).
4. Étapes spécifiques par situation cochée (SIRET, tags services/compétences, famille→sous-catégorie — référentiels Annexe G).
5. Récap → crée entité(s), pose `main_role` (situation la plus forte), cumule capacités, init profil. Reprise possible à chaque étape.

**Critères d'acceptation :**
- Géo normalisée non NULL ; compétences en tags ; cumul de situations supporté ; aucun re-passage ne rétrograde `main_role`.

### F-02 — Connexion / déconnexion

**Objectif :** Authentifier et router selon l'identité.

**Étapes :**
1. Connexion email/OAuth.
2. Élévation super admin si email ∈ SUPER_ADMIN_EMAILS (pose capacités).
3. Routing : capacité `admin_panel` → /admin ; sinon /espace.

**Critères d'acceptation :**
- Super admin élevé au login sans script ; routing correct ; déconnexion invalide la session.

### F-03 — Reset mot de passe

**Objectif :** Récupération sans fuite d'information.

**Étapes :**
1. Demande (réponse neutre anti-énumération).
2. Email Supabase Auth (lien expirant).
3. Nouveau mot de passe.

**Critères d'acceptation :**
- Réponse toujours neutre ; lien à usage unique et expirant.

### F-04 — Suppression de compte (RGPD)

**Objectif :** Supprimer et anonymiser.

**Étapes :**
1. Confirmation forte.
2. Soft-delete + masquage annuaire + anonymisation PII (profil-tombstone).
3. Messages : expéditeur anonymisé, contenu conservé pour le destinataire.
4. Purge Storage (avatars/cv/proofs/exports).
5. Email de confirmation + déconnexion.

**Critères d'acceptation :**
- Fiche retirée de l'annuaire ; PII anonymisées ; historique du destinataire préservé ; fichiers Storage purgés.

### F-05 — Création / édition de fiche entité

**Objectif :** Doter une entité d'une fiche riche et vérifiable.

**Étapes :**
1. Depuis /espace (profil conservé).
2. Champs structurés (site, Maps, GBP, géo, services ≠ segments, sous-catégorie ; description ; logo).
3. Sauvegarde → entité active (publiée) ; score de complétion.

**Critères d'acceptation :**
- Profil jamais écrasé ; champs persistés ; services validés serveur (référentiel Annexe G).

### F-06 — Vérification de fiche (toute entité)

**Objectif :** Badge vérifié pour société, fournisseur, centre, indépendant.

> B5 + T9 : la révocation conditionnelle de `publish_job` est portée par `recalc_entity_capabilities` ; les preuves vont dans le bucket `verification-proofs` (Annexe B).

**Étapes :**
1. Demande par créneaux structurés + questionnaire (preuves → bucket `verification-proofs`).
2. File admin → approuver (`verified=true` + rôle `verified_*` + pose `publish_job` via `recalc_entity_capabilities`) / refuser (motif).
3. En cas de refus OU de perte ultérieure de vérification : **appel de `recalc_entity_capabilities(user_id)`** qui révoque `publish_job` si plus aucune entité vérifiée.
4. Refresh des capacités/session (cf. chap. 13).

**Critères d'acceptation :**
- Les 4 types d'entités peuvent être vérifiés ; badge sans reconnexion ; `publish_job` posée à l'approbation et révoquée si la dernière vérification tombe (B5).

### F-07 — Revendication de fiche (claim)

**Objectif :** Revendiquer une fiche pré-créée.

**Étapes :**
1. « C'est mon entreprise » → preuve (domaine email ou justificatif).
2. File admin → approuver (rattachement) / refuser (motif).

**Critères d'acceptation :**
- Aucune fiche détournée sans preuve ; rattachement éditable après approbation.

### F-08 — Annuaire & recherche

**Objectif :** Trouver et entrer en relation.

**Étapes :**
1. Recherche globale via `search_index` (autocomplétion + catégorie).
2. Filtres service + géo + vérifié ; liste + carte.
3. Consultation → connexion / suivi / contact / message.

**Critères d'acceptation :**
- Résultats filtrables ; URL partageable ; états vides utiles.

### F-09 — Connexions, suivi & recommandations

**Objectif :** Construire le graphe social.

**Étapes :**
1. Connexion : l'émetteur crée une demande (pending) ; SEUL le destinataire peut l'accepter (2B).
2. Suivi unilatéral ; recommandation rattachée au profil (modérable).

**Critères d'acceptation :**
- Liens créés/supprimables ; l'émetteur ne peut pas auto-accepter (2B) ; recommandations signalables ; blocage respecté.

### F-10 — Offre d'emploi & candidature

**Objectif :** Recruter et postuler.

> B1 : `jobs.slug` (unique) alimente la route `/emploi/{slug}`. T1 : `jobs.lat/lng` indexés pour la recherche géolocalisée.

**Étapes :**
1. Publication (slug généré applicatif `slugify(titre)+hash` ; gating réel, auto-publication entité vérifiée) → /emploi/{slug} + alertes.
2. `expires_at` (défaut +60 j), clôture/réouverture par le recruteur.
3. Candidature (anti-doublon) → suivi (submitted→…→hired|rejected|withdrawn).

**Critères d'acceptation :**
- Offre vérifiée visible sous `/emploi/{slug}` ; offre expirée/soft-deleted retirée de la recherche ; candidature suivie ; alertes envoyées.

### F-11 — Association (candidature & sous-traitance)

**Objectif :** Rejoindre le club gratuit validé.

**Étapes :**
1. Candidature adhésion → file admin → approuver/refuser (motif).
2. À l'approbation : statut membre actif immédiat → `access_subcontracting` + `publish_mission` → espace privé + sous-traitance.

**Critères d'acceptation :**
- Adhésion approuvable ; sous-traitance débloquée sans reconnexion.

### F-12 — Devenir rédacteur & espace rédaction (3 piles)

**Objectif :** Ouvrir la rédaction à tout user ; exposer ses articles sur son profil.

**Étapes :**
1. Tout user connecté candidate (expertise, motivation) — rate-limité.
2. File admin → approuver (cap `write_article` + espace rédaction) / refuser (motif).
3. Espace à 3 piles : Brouillons · En attente · Publiés.
4. Rédaction (image fiable via Storage) → soumission → pending → validation → published.
5. Article published affiché sur la fiche profil de l'auteur.

**Critères d'acceptation :**
- Candidature ouverte à TOUT user ; 3 piles avec compteurs ; upload fiable et persistant ; article publié visible sur le profil.

### F-13 — Cycle de vie d'un article

**Objectif :** Workflow éditorial gardé.

**Étapes :**
1. draft → pending (image requise) → published | rejected (motif).
2. published → archived ; published → révision (article enfant) → validation → remplace.
3. Article published listé sur le profil ; soft-deleted → disparaît de la recherche (B3).

**Critères d'acceptation :**
- Transitions gardées serveur + RLS ; révision sans casser la version en ligne ; `deleted_at` retire de `search_index`.

### F-14 — Modération / signalement

**Objectif :** Traiter contenus litigieux.

> B4 : la RLS `messages_update` autorise `auth.uid() = sender_id OR has_capability('moderate')` — le modérateur peut donc poser `flagged=true`.

**Étapes :**
1. « Signaler » (article/profil/message/recommandation/entité) → `report`.
2. Pour un message : le modérateur peut poser `flagged=true` (RLS `messages_update` autorise `moderate`), ce qui rend le message lisible par la modération.
3. Décision : dismiss | hide | warn | suspend | ban | delete (motif) ; auto-hide possible ; escalade d'urgence.
4. Récidive : 3 signalements validés → suspension auto 24 h ; notifications + audit.

**Critères d'acceptation :**
- Décision tracée ; un modérateur peut effectivement flagger puis lire un message signalé (B4) ; messages non signalés restent privés.

### F-15 — Messagerie temps réel (1-1)

**Objectif :** Échange direct entre membres.

**Étapes :**
1. Depuis un profil/fiche → « Message » → conversation 1-1 (clé `direct_key` unique).
2. Temps réel via Realtime ; accusés envoyé/lu (global par conversation, cf. T4) ; présence.
3. Pièces jointes (Storage, ≤5 Mo, ≤5 par message) ; blocage ; notifications hors-ligne via file.
4. Fallback polling si Realtime indisponible (cf. chap. 19).

**Critères d'acceptation :**
- Message livré en temps réel ; non-participant exclu (RLS) ; envoi refusé si bloqué ; hors-ligne notifié ; seconde conversation directe A-B refusée (UNIQUE `direct_key`).

### F-16 — Partage sortant & Open Graph

**Objectif :** Amplifier le contenu.

**Étapes :**
1. Boutons de partage (LinkedIn, lien, email) sur profils, fiches, articles, offres.
2. OG + Twitter Card complets par type de page.

**Critères d'acceptation :**
- Le partage génère l'URL canonique + un aperçu riche ; pas de SDK tiers intrusif.

### F-17 — Modification d'un article publié

**Objectif :** Éditer sans casser l'intégrité.

**Étapes :**
1. Édition d'un published → crée une révision (article enfant, draft).
2. Soumission → pending → validation → remplace la version publiée.
3. Corrections mineures : édition directe réservée `moderate`, journalisée.

**Critères d'acceptation :**
- La version publiée reste en ligne pendant la révision ; remplacement seulement après validation.

### F-18 — Clôture / expiration d'offre

**Objectif :** Éviter les offres obsolètes.

**Étapes :**
1. `expires_at` (défaut +60 j) ; `closed` manuel ; `archived` auto à expiration.
2. closed/archived/soft-deleted retirée de /emploi et de `search_index`.

**Critères d'acceptation :**
- Offre expirée disparaît de l'annuaire ; recruteur peut clôturer/rouvrir.

### F-19 — Vérification multi-entités & retrait

**Objectif :** Couvrir fournisseurs/centres/indépendants et gérer le retrait.

> B5 : `recalc_entity_capabilities` est appelée aussi au retrait d'entité, pas seulement à la vérification.

**Étapes :**
1. `verification_requests` pointe vers `entity_id` ; questionnaire adapté.
2. Approbation → `verified=true` + rôle `verified_*` + `recalc_entity_capabilities` (pose `publish_job`).
3. **Retrait/archivage d'une entité** → appel de `recalc_entity_capabilities(user_id)` pour chaque membre, afin de révoquer `publish_job` si plus aucune entité vérifiée.

**Critères d'acceptation :**
- Un fournisseur/centre/indépendant obtient un badge ; élévation sans reconnexion ; le retrait d'entité recalcule correctement `publish_job` (B5).

### F-20 — Portabilité des données (export RGPD)

**Objectif :** Droit à la portabilité.

> T11 : pas de table `gdpr_requests` — l'état transite par `notification_queue` (type `gdpr_export_ready`) + bucket `exports`.

**Étapes :**
1. Paramètres → « Exporter mes données » → génération async (`notification_queue`, type `gdpr_export_ready`).
2. Export JSON (profil, fiches, articles, messages envoyés, candidatures, connexions) stocké dans le bucket `exports`.
3. Lien signé expirant envoyé (template `gdpr_export_ready`).

**Critères d'acceptation :**
- Export complet au format réutilisable, dans un délai borné ; aucun état persistant en table dédiée (T11).

### F-21 — Ajout d'une entité secondaire (multi-entités)

**Objectif :** Gérer le cumul sans destruction.

**Étapes :**
1. /espace → « Ajouter une activité » → mini-wizard.
2. Crée `entity` + `entity_member` ; switcher d'entité affiché (persisté via `profiles.current_entity_id`).
3. `main_role` inchangé ; capacités cumulées.

**Critères d'acceptation :**
- Plusieurs entités cohabitent ; switcher contextualise et persiste (T5) ; aucun rôle/donnée dégradé.

### F-22 — Invitation & co-gestion d'entité

**Objectif :** Co-gérer une fiche.

**Étapes :**
1. Owner → « Inviter un collègue » (email + rôle manager/editor).
2. `entity_member` (invite_status=pending) + email + notification.
3. Invité accepte → co-édition ; owner peut révoquer ; editor ne peut pas inviter.

**Critères d'acceptation :**
- Collègue invité co-édite après acceptation ; editor ni invite ni supprime ; un editor NE PEUT PAS se promouvoir owner (2A, trigger guard) ; révocation immédiate.

### F-23 — Messagerie de groupe (Phase 3)

**Objectif :** Spécifié, activé en Phase 3.

**Étapes :**
1. `conversations.type='group'` ; `conversation_members.role` group_admin|member ; ajout/retrait par admin de groupe ; quitter (`left_at`).
2. En Phase 1-2 : seules les conversations 'direct' existent.

**Critères d'acceptation :**
- Le schéma prévoit les groupes sans migration ; activation Phase 3.

### F-24 — Notifications & contact

**Objectif :** Informer et recevoir un contact.

> Décision v9 maintenue : aucune table `leads`. Le contact ouvre une conversation 1-1 + notification.

**Étapes :**
1. Événement → notification in-app + email (via file) selon préférences.
2. Centre de notifications (cloche, non-lus, tout lire).
3. Contact depuis profil/fiche → ouvre une conversation + notification.

**Critères d'acceptation :**
- Action admin notifie la cible ; un contact ouvre une conversation (PAS de table `leads`) ; préférences respectées.

### F-25 — Retrait d'une fiche tierce (droit d'opposition)

**Objectif :** Conformité annuaire (LCEN/RGPD).

**Étapes :**
1. Sur fiche non revendiquée (`source_consent='seed_unconsented'`) : lien « Revendiquer ou demander le retrait ».
2. « Demander le retrait » → formulaire (email pro, motif, preuve) → `entity_removal_requests` (open).
3. File admin → approuver (entité archivée + retirée annuaire/`search_index` + `recalc_entity_capabilities` des membres) / refuser (motif).
4. Confirmation par email ; trace audit.

**Critères d'acceptation :**
- Une entreprise tierce obtient le retrait de sa fiche non consentie ; disparition de l'annuaire et de la recherche ; tracé.

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

