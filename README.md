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

## Phase 0 — le premier geste (impératif)

Le SQL a été vérifié structurellement mais **jamais exécuté** contre un vrai Postgres+PostGIS. **Avant tout build applicatif**, exécuter le socle et faire passer **les 21 tests pgTAP au vert** :

```bash
export DATABASE_URL="postgresql://postgres:[PWD]@db.tefjghkoawbbvtypdeoe.supabase.co:5432/postgres"
pnpm db:test        # migrations → RLS → seed → 21 tests pgTAP
pnpm db:types       # régénère src/types/database.types.ts
```

Puis valider le point **3C** : format de retour de `custom_access_token_hook` contre la version d'Auth installée (bloque toute connexion si erroné).

> CI : le job `db` rejoue ce socle contre un Postgres+PostGIS nu via des shims `auth`/`tests` (`USE_AUTH_SHIMS=1`). Le run **autoritaire** reste le projet Supabase de test.

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
| `pnpm test:e2e` | Playwright (parcours F-01→F-25) |
| `pnpm db:test` | socle SQL + 21 tests pgTAP |
| `pnpm db:types` | régénère les types DB |

## Roadmap

Phase 0 (socle SQL vert) → **MVP 1** annuaire → **MVP 2** contenu & modération → **MVP 3** réseau & messagerie 1-1 → **MVP 4** emploi & club. Détail : [`docs/08-roadmap-tests.md`](./docs/08-roadmap-tests.md).
