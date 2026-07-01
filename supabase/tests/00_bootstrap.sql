-- ============================================================================
-- Bootstrap de shims — POUR EXÉCUTION HORS SUPABASE UNIQUEMENT (CI Postgres nu,
-- Docker local sans stack Auth). Recrée le strict nécessaire fourni nativement
-- par Supabase : schéma `auth`, auth.users, auth.uid(), auth.jwt(), schéma `tests`.
--
-- ⚠️ NE PAS charger sur le vrai projet Supabase de test : `auth` y existe déjà.
-- Le script db-test.sh ne l'inclut que si USE_AUTH_SHIMS=1.
-- ============================================================================

create schema if not exists auth;
create schema if not exists tests;

-- Table auth.users minimale (id + email). Sur Supabase, gérée par le service Auth.
create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text unique
);

-- auth.uid() : lit le claim `sub` du JWT simulé (request.jwt.claims).
create or replace function auth.uid()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

-- auth.jwt() : renvoie l'ensemble des claims simulés.
create or replace function auth.jwt()
returns jsonb language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb);
$$;

-- auth.role() : rôle applicatif simulé (authenticated / anon / service_role).
create or replace function auth.role()
returns text language sql stable as $$
  select coalesce(current_setting('role', true), 'anon');
$$;
