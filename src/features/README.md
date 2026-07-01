# `features/` — slices verticaux par domaine métier

Chaque domaine regroupe tout ce qui le concerne. Convention de fichiers :

```
features/<domaine>/
├── actions.ts      # Server Actions (mutations) : 'use server' → Zod → has_capability → mutation → audit_logs
├── queries.ts      # Lectures serveur (RSC/RPC d'agrégation, anti N+1, pagination keyset)
├── schemas.ts      # Schémas Zod (enums construits depuis src/referentiels — jamais en dur)
├── types.ts        # Types dérivés (souvent de database.types.ts)
├── components/      # UI spécifique au domaine (Server/Client Components)
└── hooks.ts         # hooks client (TanStack Query pour l'interactif uniquement)
```

## Domaines prévus (mappés aux modules M01→M18 du PRD)

| Domaine | Modules | MVP |
|---|---|---|
| `auth` | M02 | 1 |
| `onboarding` | M03 | 1 |
| `profiles` | M04 | 1 |
| `entities` | M05 | 1 |
| `directory-search` | M05, M16 | 1 |
| `verification` | M05 | 1 |
| `articles` | M08 | 2 |
| `resources` | M09 | 2 |
| `notifications` | M14 | 2 |
| `moderation` | M13 | 2 |
| `social-graph` | M06 | 3 |
| `messaging` | M07 | 3 |
| `jobs` | M10 | 4 |
| `association` | M11 | 4 |
| `subcontracting` | M12 | 4 |
| `admin` | M15, M17 | transverse |

## Règles

- **Mutations internes** = Server Actions (`actions.ts`). **Public/externe** = Route Handlers (`src/app/api`).
- Toute entrée validée par Zod ; toute transition d'état gardée serveur + journalisée (`audit_logs`).
- Les 4 états UI (vide/chargement/erreur/succès) sont obligatoires sur chaque écran de données.
- L'autorisation passe par les capacités (`has_capability` app + RLS) — jamais par un `role`.
