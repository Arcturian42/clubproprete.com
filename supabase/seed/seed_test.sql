-- ============================================================================
-- ClubProprete.com — Seed de test (E) — PRD v13.0
-- Utilisateurs minimaux requis par les tests pgTAP (Annexe H).
-- À charger sur une base de TEST uniquement, avant tests_pgtap.sql.
--   psql ... -f schema_full.sql -f rls_v9.sql -f seed_test.sql -f tests_pgtap.sql
--
-- Note : en environnement Supabase, auth.users est géré par le service Auth.
-- Pour un test local, on insère directement les lignes auth.users (le trigger
-- handle_new_user créera les profiles), puis on complète les profils.
-- ============================================================================

-- Les 3 UUID fixes utilisés par les tests
--   u_owner  = 11111111-1111-1111-1111-111111111111
--   u_editor = 22222222-2222-2222-2222-222222222222
--   u_third  = 33333333-3333-3333-3333-333333333333

-- Insertion dans auth.users (déclenche handle_new_user -> profiles).
-- Colonnes minimales ; adapter selon la version d'auth.users de l'instance.
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111','owner@test.local'),
  ('22222222-2222-2222-2222-222222222222','editor@test.local'),
  ('33333333-3333-3333-3333-333333333333','third@test.local')
on conflict (id) do nothing;

-- Si le trigger handle_new_user n'est pas actif dans l'environnement de test,
-- créer les profils explicitement (idempotent).
insert into public.profiles (user_id, first_name, last_name, slug, visibility)
values
  ('11111111-1111-1111-1111-111111111111','Olivia','Owner','u-owner','public'),
  ('22222222-2222-2222-2222-222222222222','Ed','Editor','u-editor','public'),
  ('33333333-3333-3333-3333-333333333333','Théo','Third','u-third','public')
on conflict (user_id) do nothing;
