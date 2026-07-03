# ClubProprete.com

Le réseau professionnel de toute la propreté française — plateforme B2B **entièrement gratuite** (« LinkedIn de la propreté »). Projet _from scratch_, Next.js 15 + Supabase.

> **Source de vérité produit** : [`CLAUDE.md`](./CLAUDE.md) (à lire en premier), [`PRD_ClubProprete_v13_FINAL.md`](./PRD_ClubProprete_v13_FINAL.md) et les vues thématiques dans [`docs/`](./docs).

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Base + Auth + Storage + Realtime | Supabase (Postgres, RLS sur 46 tables) |
| Validation | Zod (enums générés depuis `src/referentiels`) |
| UI | Tailwind + shadcn/ui, tokens WCAG 2.1 AA |
| Email | Resend | Analytics : Plausible + PostHog (sans cookies) |
| Hébergement | Vercel | Rate limiting : table Postgres `rate_limits` |

## Décisions fermes (ne jamais contredire)

Gratuité totale · autorisation **100 % par capacités** (`has_capability` + RLS, **aucun claim `role`**) · messagerie 1-1 d'abord (groupes en Phase 3) · modération livrée **avec** l'UGC · pas de table `leads` · référentiels métier = source unique (`src/referentiels` ↔ `docs/11`) · FR-FR sans champ `locale` · `SUPER_ADMIN_EMAILS=clement@pershingsolution.com`.

## Démarrage

```bash
pnpm install
cp .env.example .env.local   # remplir les clés Supabase (projet de test)
pnpm dev
```

## État d'avancement

**Phase 0 : VALIDÉE** — socle exécuté contre un vrai Postgres 16 + PostGIS + pgTAP :
**21/21 tests verts**, RPC (0003) smoke-testées, seed dev **200 profils / 80 fiches /
50 vérifiées** vérifié par exécution. 5 bugs d'exécution corrigés (dont un trou de
sécurité RLS d'auto-promotion owner et une collision de slug au signup).

**MVP 1 → 4 : construits et déployés** sur Vercel (`clubproprete-com.vercel.app`).

- **MVP 1** — auth, onboarding, profils, fiches 4 types, annuaire+recherche, vérification, back-office
- **MVP 2** — articles (éditeur Markdown sanitizé, 3 piles, blog), candidature rédacteur, ressources, notifications in-app, **modération** (signalements, flagging, auto-hide, récidive)
- **MVP 3** — graphe social (connexions/suivi/recommandations/blocage), messagerie 1-1 Realtime + fallback, contact fiche (F-24)
- **MVP 4** — emploi (offres/candidatures/alertes), association (adhésion→capacités), sous-traitance (missions)

Design system v2 (Geist, palette bleus, glassmorphism). Typecheck, lint, build (48 routes),
18 tests unitaires et 7 E2E : verts. SQL validé 21/21 pgTAP + seed 200/80/50 (Postgres réel).

### Il reste 3 gestes sur le projet Supabase (à faire ensemble)

1. **Appliquer le socle** — SQL Editor → coller `supabase/apply_all.sql` (schéma+RLS+RPC) → Run.
2. **Activer l'Auth Hook (3C)** — Authentication → Hooks → *Custom Access Token* →
   `public.custom_access_token_hook`. Tester un vrai login (le format de retour est
   la seule inconnue restante).
3. **Optionnel** : seed d'amorçage — coller `supabase/seed/seed_dev.sql` (idempotent).

Puis côté app : renseigner `.env.local` (cf. `.env.example`), `pnpm dev`.
Buckets Storage (Annexe B) : à créer avant d'activer les uploads (logo/photos/CV).

```bash
pnpm db:test        # rejouer le socle + 21 pgTAP (DATABASE_URL requis)
pnpm db:types       # régénérer les types une fois le projet lié
```

> CI : le job `db` rejoue ce socle contre un Postgres+PostGIS nu via des shims
> `auth`/`tests` (`USE_AUTH_SHIMS=1`).

## Structure

```
src/
├── app/                 # App Router — (public) (auth) (espace) (admin) + api
├── features/            # domaines métier en slices verticaux
│   └── <feature>/       #   actions.ts · queries.ts · schemas.ts · types.ts · components/
├── components/          # ui/ (design system) · layout/ · states/ (4 états UI)
├── lib/                 # supabase/ · auth/ · validation/ · rate-limit/ · email/ · seo/ · …
├── referentiels/        # G.1→G.6 — SOURCE UNIQUE des enums Zod
├── config/              # capabilities · notifications · routes
├── i18n/                # microcopy FR par clés
└── types/               # database.types.ts (généré)
supabase/
├── migrations/          # 0001_schema.sql · 0002_rls.sql · …
├── seed/  tests/  functions/
```

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` / `lint` / `test` | qualité + tests unitaires (Vitest) |
| `pnpm test:e2e` | Playwright (7 specs publics ; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` si navigateur préinstallé) |
| `pnpm db:test` | socle SQL + 21 tests pgTAP |
| `pnpm db:types` | régénère les types DB |

## Roadmap

Phase 0 (socle SQL vert) → **MVP 1** annuaire → **MVP 2** contenu & modération → **MVP 3** réseau & messagerie 1-1 → **MVP 4** emploi & club. Détail : [`docs/08-roadmap-tests.md`](./docs/08-roadmap-tests.md).
