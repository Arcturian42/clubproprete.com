#!/usr/bin/env bash
# ============================================================================
# Phase 0 — exécute le socle SQL et les 21 tests pgTAP sur le Supabase de TEST.
# Prérequis : DATABASE_URL exportée (cf. .env.example), psql installé,
# extension pgtap disponible sur le projet.
#
#   export DATABASE_URL="postgresql://postgres:[PWD]@db.<ref>.supabase.co:5432/postgres"
#   pnpm db:test
#
# Les 21 tests DOIVENT passer au vert avant tout build applicatif (CLAUDE.md §7).
# ============================================================================
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL manquante — voir .env.example}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Hors Supabase (CI Postgres nu / Docker local) : injecter les shims auth/tests.
# NE PAS activer sur le vrai projet Supabase (schéma `auth` déjà présent).
if [ "${USE_AUTH_SHIMS:-0}" = "1" ]; then
  echo "→ 0/4 Bootstrap shims auth/tests (hors Supabase)"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/00_bootstrap.sql"
fi

echo "→ 1/4 Schéma (extensions, énums, helpers, 46 tables, triggers)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/0001_schema.sql"

echo "→ 2/4 RLS (policies capacités, aucun claim role)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/0002_rls.sql"

# Hors Supabase : appliquer les GRANTs que Supabase pose par défaut (default
# privileges anon/authenticated/service_role sur public). La RLS reste le gate.
if [ "${USE_AUTH_SHIMS:-0}" = "1" ]; then
  echo "→ 2b   GRANTs public → anon/authenticated/service_role (hors Supabase)"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
SQL
fi

echo "→ 3/4 Seed de test (3 utilisateurs)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/seed/seed_test.sql"

echo "→ 4/4 Tests pgTAP (21 scénarios RLS & sécurité)"
# pgTAP peut être pré-installé dans le schéma `extensions` sur Supabase ; le
# fichier de tests référence un schéma `tests` (tests.act_as) qui n'existe pas
# par défaut sur un projet nu. On garantit les deux, puis on exécute avec un
# search_path qui couvre public + extensions + tests.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "create extension if not exists pgtap;"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "create schema if not exists tests;"
PGOPTIONS="--search_path=tests,public,extensions" \
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/04_tests_pgtap.sql"

echo "✅ Phase 0 SQL exécuté. Vérifier que les 21 tests sont au vert ci-dessus."
