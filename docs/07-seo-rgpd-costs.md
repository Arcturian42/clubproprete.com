# SEO/GEO, RGPD & coûts

> Extrait du PRD ClubProprete.com v13 — chap. 20, 21, 21bis. Source de vérité complète : `../PRD_ClubProprete_v13_FINAL.md`.

---

## 20. SEO / AEO / GEO

- Pages publiques SSG/ISR ; pages géo programmatiques `/annuaire/{type}/{région}/{ville}` en ISR on-demand ; sitemap régénéré à chaque publication.
- **Seuil ville** : page indexable seulement si ≥ 1 entité active ; sinon 301 vers la région (anti contenu mince). Canonicals ; noindex sur filtres ; 301 via `slug_history`.
- Schema.org par type (FAQPage, Organization, ItemList, LocalBusiness, Person, Article, JobPosting, Course).

**Calendrier éditorial (12 mois)** : pré-lancement 20 articles piliers (CCN propreté IDCC 3043, grille salaire 2026, sous-traitance, CACES, logiciels) ; mois 1-3 : 2/sem + ouverture communautaire ; mois 4-12 : 2/sem + 4 pages géo enrichies/mois.

**KPIs** : trafic organique, pages indexées, position moyenne (10-20 mots-clés), CTR, backlinks (Search Console + Plausible sans cookies). **GEO** : suivi des citations (ChatGPT/Perplexity/Gemini/AI Overviews) sur un panel de prompts métier.

---

## 21. Coûts, sauvegarde, modération solo, secrets, conformité FR

### 21.1 Coûts d'infra (ordres de grandeur)
| Service | Usage | Logique de coût |
|---|---|---|
| Supabase | Postgres+Auth+Storage+Realtime | Tier de départ ; surveiller le pic Realtime concurrent et le stockage |
| Vercel | Next.js + ISR + Edge | Tier de départ ; trafic + invocations |
| Upstash (différé) | Rate limiting à la montée en charge | 0 au lancement (rate limiting via Postgres `rate_limits`) ; adopté plus tard si la concurrence le justifie |
| Resend | Emails | Quota gratuit puis au volume |
| PostHog / Plausible | Analytics | Plausible faible sans cookies ; PostHog au volume (option self-host) |

Poste à surveiller en priorité : Realtime. Le fallback polling protège disponibilité ET facture. Alertes de seuil dès la Phase 1.

### 21.2 Sauvegarde / restauration
Backups DB quotidiens (Supabase) ; RPO ≤ 24 h, RTO ≤ quelques heures ; test de restauration documenté avant l'ouverture publique ; migrations + seed versionnés.

### 21.3 Modération par un solo (garde-fous)
Auto-modération niveau 1 (liste noire mots-clés → auto-hide + alerte ; hash de contenu masqué → auto-hide) ; récidive auto (3 signalements validés → suspension 24 h) ; file plafonnée des candidatures rédacteur ; SLA « best effort ».

### 21.4 Environnements & secrets
Staging + prod séparés ; secrets en variables d'env, jamais commités ; compromission super_admin : rotation `SUPER_ADMIN_EMAILS` + step-up + révocation des sessions + audit.

### 21.5 Conformité française
| Sujet | Traitement |
|---|---|
| Mentions légales (LCEN) | Page complète (éditeur, hébergeur, directeur de publication) dès le lancement |
| Fiches tierces non consenties | Flow F-25 + `source_consent='seed_unconsented'` + lien de retrait sur chaque fiche non revendiquée |
| Cookies / CNIL | Plausible sans cookies ; PostHog sans cookies ou bannière conforme ; aucune pub |
| RGPD | Suppression (F-04), portabilité (F-20), anonymisation des messages (chap. 21bis) |

---

## 21bis. RGPD — protocole détaillé

| Sujet | Règle |
|---|---|
| Délai de traitement | Demandes RGPD traitées sous 30 jours. |
| Export (portabilité) | JSON : profil, fiches gérées, articles, candidatures, connexions/follows, recommandations émises, messages envoyés. Lien signé expirant (bucket `exports`, 60 min). État via `notification_queue` type `gdpr_export_ready` (T11). |
| Conservation par type | Compte actif : tant qu'il existe. Après suppression : PII anonymisées immédiatement ; logs d'audit conservés ; pièces jointes purgées après délai légal (défaut 30 j, Annexe F). |
| Purge Storage | À la suppression : avatars/cv/proofs/exports supprimés ; message-attachments purgés après délai légal (texte conservé, expéditeur anonymisé). |
| Registre des traitements | Finalité, base légale (contrat / intérêt légitime / consentement emails non essentiels), durées. |
| Contestation / refus | Demande de retrait/opposition refusée → motivée et notifiée ; recours CNIL indiqué. |

> Cohérence messagerie : la suppression anonymise l'expéditeur (profil-tombstone) mais conserve le texte pour le destinataire (intérêt légitime) — l'effacement porte sur les PII, pas sur le contenu relationnel du tiers.

---

