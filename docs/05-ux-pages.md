# UX, pages & fonctionnalités

> Extrait du PRD ClubProprete.com v13 — chap. 8 à 10. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## 8. UX écran par écran

> **Les 4 états UI obligatoires sur chaque écran de données** : Vide (message + CTA) · Chargement (skeletons, layout stable) · Erreur (message explicite + reprise) · Succès (contenu + feedback).

### Profil public (/p/{slug})
```
[photo] Prénom Nom            [Se connecter] [Suivre] [Message]
        Headline · Ville (69) · ✔ Vérifié · ★ Membre
À propos | Compétences (tags) | Entités liées
Publications | ▸ ses articles publiés (comme LinkedIn)
Recommandations | ▸ « Pro et fiable » — A. Martin
```
**CTA :** « Se connecter » (primaire) ; « Suivre », « Message » (secondaires).

**États UI :** Vide : sections masquées + invite. Erreur : slug inexistant → 404 ; section publications en échec → reste visible.

### Espace rédaction — 3 piles (/espace/redaction)
```
Espace rédaction                       [ + Nouvel article ]
Brouillons (3)   |  En attente (1)  |  Publiés (7 ↗ profil)
```
**CTA :** « + Nouvel article » (primaire) ; actions par carte.

**États UI :** Vide : par pile + CTA. Mobile : 3 piles → onglets.

### Messagerie (/espace/messages)
```
Conversations │  A. Martin · en ligne ●
 A. Martin ●2 │  Bonjour, dispo ?
              │  [+ pièce jointe] [écrire........] [Envoyer]
```
**CTA :** « Envoyer » (primaire) ; sélection de conversation.

**États UI :** Erreur : perte Realtime → bannière + reconnexion auto + file d'envoi ; destinataire bloqué → envoi refusé.

### Annuaire (/annuaire/{type})
```
[🔍 nettoyage à Lyon....] Service[▾] Géo[▾] ☑Vérifié
42 résultats · tri pertinence ▾
[card société ✔] [card société] [card fournisseur] ...   Liste ⇄ Carte
```
**CTA :** « Voir la fiche » (card) ; filtres.

**États UI :** Vide : « Aucun résultat — élargissez la zone ». Mobile : carte par défaut, filtres en drawer.

### Back-office — demandes (/admin/demandes)
```
Demandes [Vérif.][Adhésions][Rédacteurs][Claims][Retraits]
Statut[pending▾]  [Export] [Bulk ▾]
Détail → [Approuver] [Refuser ▾ motif obligatoire]
```
**CTA :** « Approuver » / « Refuser » (motif obligatoire) ; bulk.

**États UI :** Vide : « Aucune demande ». Erreur : action concurrente → refresh ; refus sans motif → bloqué.

### 8.1 Accessibilité (WCAG 2.1 AA)

Contraste ≥ 4,5:1 ; cibles ≥ 44×44 px ; navigation clavier complète + focus visible ; toasts en `aria-live=polite` ; `prefers-reduced-motion` & `prefers-color-scheme` respectés ; zoom 200 % sans perte.

### 8.2 Microcopy (clés i18n)

| Clé | Texte |
|---|---|
| `error_upload_image` | « L'image n'a pas pu être chargée. Vérifiez qu'elle fait moins de 5 Mo (JPG ou PNG) et réessayez. » |
| `empty_messages` | « Vous n'avez pas encore de messages. Trouvez un professionnel près de chez vous pour démarrer. » |
| `success_article_submitted` | « Votre article « {titre} » est soumis. Il sera relu avant publication et vous serez notifié. » |
| `success_verification_requested` | « Demande envoyée. Nous vous appellerons sur le créneau choisi : {date} {matin/après-midi}. » |
| `error_rate_limited` | « Trop de tentatives. Réessayez dans {delay}. » |

> Toute la microcopy est centralisée par clés techniques (i18n réversible — décision FR-FR sans champ `locale`).

---

## 9. Pages & espaces

### 9.1 Pages publiques (indexables)

| Page | Objectif | Schema.org |
|---|---|---|
| Accueil / | Convertir + recherche + preuve sociale | FAQPage, Organization, WebSite |
| Annuaire /annuaire/{type}[/{région}/{ville}] | Découvrir/filtrer + longue traîne géo | ItemList, BreadcrumbList, Place |
| Profil /p/{slug} | Identité pro + publications | Person, ProfilePage |
| Fiche /{type}/{slug} | Vitrine + contact | LocalBusiness/Organization |
| Blog /blog + /blog/{slug} | Média, auteur cliquable | Article, Person, FAQPage |
| Emploi /emploi + /emploi/{slug} | Job board + candidature | JobPosting |
| Formations, Association, Ressources, Devenir rédacteur, Légal | Institutionnel + conversion | FAQPage / Organization |

### 9.2 Espace membre (/espace/*) — coquille persistante, noindex

Sidebar : Mon profil · Mon réseau · Messages · Ma/Mes fiche(s) (+ switcher persisté `current_entity_id`) · Espace rédaction · Mes offres · Mes candidatures · Sous-traitance · Paramètres. Centre = dashboard actif (feed + suggestions) ; recherche globale dans le header.

### 9.3 Back-office (/admin/*) — noindex, RLS réservé

Vue d'ensemble (KPI) · Utilisateurs & capacités · Entités · Demandes (vérif/adhésion/rédacteur/claim/retrait) · Modération & signalements · Blog · Ressources · Paramètres · Audit.

### 9.4 Responsive

Sidebar → bottom navigation (5 onglets) ; rédaction 3 piles → onglets ; messagerie → stack ; annuaire → carte + filtres en drawer. Breakpoints sm 640 / md 768 / lg 1024 / xl 1280.

---

## 10. Fonctionnalités clés (règles & critères)

### 10.1 Score de complétion de fiche (barème)

| Élément | Points |
|---|---|
| Nom + SIRET | 10 |
| Ville normalisée (INSEE) | 10 |
| ≥ 1 service (référentiel) | 12 |
| Segments clients | 6 |
| Logo | 10 |
| ≥ 3 photos | 8 |
| Site web | 8 |
| Lien Google Maps | 6 |
| Lien Google Business | 6 |
| Zones d'intervention | 6 |
| Description | 8 |
| Fiche vérifiée | 10 |

Seuils : < 50 % Incomplet · 50–79 % Correct · ≥ 80 % Optimisé. Calcul serveur (RPC), recalcul à chaque sauvegarde.

> B2 : le champ « Description » (8 pts) est désormais stockable — `companies.description` ajouté (et intégré à `search_index`).

### 10.2 Référentiels (données propres)

- Services propreté (énum applicative validée serveur) ≠ segments clients — **listes fermées en Annexe G**.
- Compétences en tags (table `skills`). Villes via geo.api.gouv.fr (INSEE+CP+région+lat/lng). SIRET via recherche-entreprises.api.gouv.fr.
- Taxonomie fournisseurs : famille → sous-catégorie sélectionnable (Annexe G).

### 10.3 Upload fiable (Storage)

Validation client (type, ≤5 Mo) + feedback explicite ; soumission bloquée si image requise absente ; persistance vérifiée après refresh ; jamais d'erreur avalée. Buckets détaillés en Annexe B.

---
