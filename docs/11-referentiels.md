# Référentiels métier (listes fermées pour Zod)

> Extrait du PRD ClubProprete.com v13 — Annexe G. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.
>
> SOURCE UNIQUE des enums Zod. Toute liste métier se définit ici et se propage.

---

## Annexe G — Référentiels métier (listes fermées pour Zod)

Source unique des listes fermées actuellement en `text`. Sert de référence aux validations Zod côté application. Toute valeur hors liste est rejetée serveur.

### G.1 Services propreté (`company_services.service_type`)
```
nettoyage_bureaux, nettoyage_industriel, nettoyage_vitres, nettoyage_apres_chantier,
remise_en_etat, decapage_sols, cristallisation_marbre, entretien_courant,
desinfection, desinsectisation, deratisation, nettoyage_cryogenique,
nettoyage_hospitalier, nettoyage_agroalimentaire, entretien_espaces_verts,
debarras, nettoyage_haute_pression, nettoyage_textile_moquette,
gestion_dechets, proprete_urbaine
```

### G.2 Segments clients (`companies.segments`)
```
bureaux, industrie, sante, collectivites, retail_commerces, hotellerie_restauration, copropriétés, education, transport_logistique, agroalimentaire
```

### G.3 Familles fournisseurs (`suppliers.family`) → sous-catégories (`suppliers.sub_category`)
| Famille | Sous-catégories |
|---|---|
| machines | autolaveuses, monobrosses, aspirateurs, nettoyeurs_haute_pression, balayeuses, injecteurs_extracteurs |
| produits_chimiques | detergents, desinfectants, decapants, cires_emulsions, produits_sanitaires, produits_sols |
| consommables | essuyage, sacs_poubelle, sanitaire_papier, accessoires_lavage |
| equipements_protection | gants, chaussures, vetements, masques, signalisation |
| materiel_manuel | chariots, balais, raclettes, seaux_presses, microfibres |
| logiciels | gestion_planning, controle_qualite, facturation, pointage_mobile, crm_proprete |
| services | formation, conseil, audit, location_materiel, maintenance |

### G.4 Types de contrat (`jobs.contract_type`) — V6
```
CDI, CDD, Freelance, Stage, Alternance, Interim, Temps_partiel
```

### G.5 Niveaux de visibilité (`visibility_level`, enum) — pour Zod
```
public, members, connections, private
```

### G.6 Certifications centres de formation (`training_orgs.certifications`, indicatif)
```
Qualiopi, CACES, SST, habilitation_electrique, CQP_proprete, certification_ISO
```

> Ces listes sont la **source unique** : le front génère ses enums Zod à partir d'elles ; toute évolution se fait ici puis se propage.

---

