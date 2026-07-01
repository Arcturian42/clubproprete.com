# Vision, périmètre & personas

> Extrait du PRD ClubProprete.com v13 — chap. 1 à 3. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## 1. Résumé exécutif

### 1.1 Le produit

ClubProprete.com est une plateforme B2B entièrement gratuite pour l'écosystème de la propreté en France. Elle réunit six facettes autour d'un cœur « réseau professionnel » de type LinkedIn vertical : profils publics riches et graphe social (connexions, suivi, recommandations, messagerie temps réel) ; annuaire B2B (sociétés, fournisseurs, centres de formation, indépendants) ; média à rédaction communautaire ouverte ; emploi (offres + candidatures) ; club associatif sur candidature validée ; et un back-office de pilotage et modération.

### 1.2 Le problème

Secteur atomisé (30 000+ entreprises), au bouche-à-oreille, sans plateforme centrale. Difficulté à recruter, à trouver des sous-traitants fiables, à se former, à se rendre visible et à se mettre en relation.

### 1.3 Les cinq causes racines et leur résolution

| Cause | Problème | Résolution |
|---|---|---|
| C1 | Rôle unique vs permissions multi-rôles ; super admin perdu | Autorisation par capacités + RLS ; super admin par variable d'env (chap. 4, 12) |
| C2 | Workflows de modération incomplets | Machine à états explicite + actions admin + audit (chap. 18) |
| C3 | Saisie non structurée (texte libre) | Autocomplétion ville, tags compétences/services, sélecteurs (chap. 8) ; référentiels en Annexe G |
| C4 | Séparation des espaces floue | Coquille /espace à navigation persistante (chap. 9) |
| C5 | Uploads cassés, erreurs avalées | Supabase Storage + feedback explicite + persistance (chap. 8, 10) |

### 1.4 Proposition de valeur

> « Le réseau professionnel de toute la propreté française : un profil qui vous rend visible, un réseau qui vous fait travailler, un média que vous écrivez — gratuitement. »

---

## 2. Vision & périmètre

| Facette | Rôle | Brique technique |
|---|---|---|
| Réseau professionnel | Identité publique, connexions, suivi, recommandations, messagerie temps réel | Profils + graphe + Supabase Realtime |
| Annuaire B2B | Découvrabilité : fiches + recherche + filtres géo | `entities` + `search_index` + RLS |
| Média / blog | Autorité & SEO : rédaction communautaire, articles sur le profil | Espace rédaction + Storage |
| Emploi | Activation : offres, candidatures, alertes | Job board vertical |
| Club associatif | Confiance : adhésion gratuite sur candidature validée | Association + statut membre |
| Back-office | Pilotage : utilisateurs, rôles, entités, demandes, modération, audit | CRM admin / super admin |

### 2.1 Principes directeurs

- **Profil au centre** : fiche, article, offre, recommandation, message — tout s'attache à une identité publique.
- **Gratuité totale** : aucune monétisation, aucune mise en avant payante.
- **Navigation stable** : coquille /espace persistante ; une fiche n'écrase jamais le profil.
- **Données propres à la saisie** : autocomplétion, tags, sélecteurs (référentiels Annexe G) ; jamais de texte libre sur les champs structurants.
- **Sécurité par conception** : autorisation portée par les RLS Postgres, alignée sur le module d'accès applicatif.

### 2.2 Hors scope (ferme)

- Toute monétisation : abonnements, fiches/profils sponsorisés, offres en vedette, affiliation, premium, publicité.
- Toute priorisation commerciale dans l'annuaire ou la recherche.
- Application mobile native (web responsive mobile-first).
- Migration de données (projet *from scratch*).

---

## 3. Personas

| Persona | Profil | Fréquence | Action principale | Prio business |
|---|---|---|---|---|
| P1 | Dirigeant de PME de nettoyage (30–200 salariés) | Hebdo → mensuel | Créer/vérifier sa fiche, recruter, trouver un sous-traitant | 🔴 Maximale |
| P2 | Indépendant / auto-entrepreneur | Hebdo | Compléter profil, candidater missions, se connecter | 🟡 Moyenne |
| P3 | Fournisseur (produits, machines, équipements, logiciels) | Mensuel | Créer fiche catégorisée, recevoir des contacts | 🟠 Haute |
| P4 | Centre / organisme de formation | Mensuel → trimestriel | Référencer organisme + formations (texte libre) | 🟠 Haute |
| P5 | Candidat / demandeur d'emploi | Ponctuel | Postuler, créer une alerte | 🟡 Moyenne (trafic) |
| P6 | Rédacteur / contributeur (tout user) | Mensuel | Candidater rédacteur, écrire et publier | 🟢 Support (autorité) |
| P7 | Membre de l'association | Hebdo → mensuel | Candidater à l'adhésion, accéder au privé + sous-traitance | 🟠 Haute (confiance) |
| P8 | Admin & Super admin | Quotidien (ops) | Valider, modérer, gérer rôles/entités, piloter | 🔴 Critique (ops) |

> **P4 (décision v9 maintenue)** : pas de catalogue structuré — les formations proposées sont en texte libre (`training_orgs.programs_text`).

---

