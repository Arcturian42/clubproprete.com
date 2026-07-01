# Routes, permissions & Storage

> Extrait du PRD ClubProprete.com v13 — Annexe B (Storage) + Annexe C (Routes). Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## Annexe B — Storage (buckets & policies)

Buckets Supabase Storage. Les policies Storage répliquent la logique RLS (ownership). Vérification serveur du MIME réel + taille avant acceptation.

| Bucket | Accès | Taille max | MIME | Chemin | Lecture / Écriture | Signed URL |
|---|---|---|---|---|---|---|
| avatars | public | 2 Mo | image/jpeg,png,webp | avatars/{user_id}/... | publique / own | — |
| entity-logos | public | 2 Mo | image/* | logos/{entity_id}/... | publique / membre entité | — |
| entity-gallery | public | 5 Mo | image/* | gallery/{entity_id}/... | publique / membre entité | — |
| article-images | public | 5 Mo | image/* | articles/{author_id}/{article_id}/... | publique si publié / auteur | — |
| message-attachments | privé | 5 Mo | image/*,application/pdf | msg/{conversation_id}/... | participants / expéditeur | 60 min |
| cv | privé | 5 Mo | application/pdf | cv/{user_id}/... | candidat + recruteur destinataire | 30 min |
| proofs | privé | 5 Mo | image/*,application/pdf | proofs/{request_id}/... | demandeur + moderate | 30 min |
| verification-proofs | privé | 5 Mo | image/*,application/pdf | verification-proofs/{request_id}/... | demandeur + moderate | 30 min |
| resources | privé | 20 Mo | application/pdf,docx | resources/{resource_id}/... | URL signée (gating email) / admin_panel | 15 min |
| exports | privé | 50 Mo | application/json,zip | exports/{user_id}/... | own | 60 min, usage unique |

> **T9** : bucket dédié `verification-proofs` (preuves de vérification d'entité), distinct de `proofs` (claims/retraits), mêmes règles.
> **Purge** : orphelins nettoyés par cron hebdomadaire ; pièces jointes d'un compte supprimé purgées après le délai légal.

---

## Annexe C — Routes & permissions

### C.1 Routes publiques (indexables sauf mention)
| Route | Accès | Notes |
|---|---|---|
| / | public | Accueil + recherche |
| /annuaire/{type} | public | ItemList |
| /annuaire/{type}/{region}/{ville} | public | ISR ; indexable si ≥1 entité, sinon 301 région |
| /p/{slug} | public | Profil ; 301 via slug_history |
| /{type}/{slug} | public | Fiche entité |
| /blog, /blog/{slug} | public | Article published |
| /emploi, /emploi/{slug} | public | **Offre published/non expirée — slug confirmé (B1)** |
| /formations, /association, /ressources | public | ressources : gating email |
| /devenir-redacteur, /a-propos, /contact, /mentions-legales, /confidentialite | public | institutionnel |
| /login, /signup, /reset | public (anon) | redirige vers /espace si connecté |

### C.2 Espace membre /espace/* (noindex, auth requise)
| Route | Garde |
|---|---|
| /espace | authentifié |
| /espace/profil, /espace/reseau, /espace/messages | authentifié |
| /espace/fiches, /espace/fiches/{entity_id} | membre de l'entité |
| /espace/redaction (+/{id}) | capacité write_article |
| /espace/offres, /espace/candidatures | authentifié (offres : membre entité vérifiée) |
| /espace/sous-traitance | capacité access_subcontracting |
| /espace/parametres | authentifié |

### C.3 Back-office /admin/* (noindex, capacité requise)
Toutes les routes /admin/* exigent `admin_panel` (ou `moderate` pour les files de modération), sinon 403. Routes : /admin, /admin/utilisateurs, /admin/entites, /admin/demandes, /admin/moderation, /admin/blog, /admin/ressources, /admin/audit, /admin/parametres.

### C.4 Règles transverses
- Middleware auth : route protégée sans session → 302 /login?next=... ; deep-link de retour après login.
- 403 : ressource existante mais non autorisée. 404 : ressource inexistante/supprimée.
- Canonical sur chaque page publique ; noindex sur /espace et /admin ; 301 via `slug_history`.

---

