-- ============================================================================
-- ClubProprete.com — Tests pgTAP (RLS & sécurité) — PRD v13.0
-- Couvre précisément les scénarios de l'audit CTO : deadlocks de création,
-- élévations de privilèges, révocation conditionnelle de capacité.
--
-- Exécution (Phase 0) :
--   create extension if not exists pgtap;
--   psql ... -f schema_full.sql -f rls_v9.sql -f seed_test.sql -f tests_pgtap.sql
--   (seed_test.sql fournit les 3 utilisateurs u_owner/u_editor/u_third — correction E)
--
-- Ces tests simulent les rôles via set_config('request.jwt.claims', ...),
-- que Supabase renseigne à partir du JWT (auth.uid() / auth.jwt()).
-- ============================================================================

begin;
select plan(21);

-- Helpers de test : usurpe un utilisateur + ses capacités dans le JWT simulé.
create or replace function tests.act_as(p_uid uuid, p_caps jsonb default '[]'::jsonb)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'capabilities', p_caps)::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- Jeux d'essai : 3 utilisateurs (owner, editor, tiers) déjà présents dans auth.users/profiles.
-- (seed minimal supposé chargé : u_owner, u_editor, u_third)
\set u_owner  '11111111-1111-1111-1111-111111111111'
\set u_editor '22222222-2222-2222-2222-222222222222'
\set u_third  '33333333-3333-3333-3333-333333333333'

-- ----------------------------------------------------------------------------
-- 1A — Un utilisateur standard PEUT créer une entité de zéro (deadlock levé)
-- ----------------------------------------------------------------------------
select tests.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into public.entities(id, type, slug, status)
     values ('aaaaaaaa-0000-0000-0000-000000000001','company','net-lyon','active') $$,
  '1A : création d''entité par un utilisateur standard réussit');

-- ----------------------------------------------------------------------------
-- 1B — Le créateur PEUT s'auto-attribuer owner sur une entité sans membre
-- ----------------------------------------------------------------------------
select lives_ok(
  $$ insert into public.entity_members(entity_id, user_id, role, invite_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'::uuid, 'owner', 'accepted') $$,
  '1B : auto-attribution du rôle owner sur entité vierge réussit');

-- Un SECOND utilisateur ne peut pas s'auto-attribuer owner (entité a déjà un membre)
select tests.act_as('33333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ insert into public.entity_members(entity_id, user_id, role, invite_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'::uuid, 'owner', 'accepted') $$,
  NULL, '1B (neg) : un tiers ne peut pas s''auto-attribuer owner sur une entité déjà possédée');

-- ----------------------------------------------------------------------------
-- 2A — Un editor invité NE PEUT PAS se promouvoir owner
-- ----------------------------------------------------------------------------
-- L'owner invite un editor
select tests.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into public.entity_members(entity_id, user_id, role, invite_status)
     values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'::uuid, 'editor', 'accepted') $$,
  '2A (setup) : l''owner invite un editor');

-- L'editor tente de passer owner -> doit échouer (trigger guard_member_role)
select tests.act_as('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ update public.entity_members set role='owner'
     where entity_id='aaaaaaaa-0000-0000-0000-000000000001' and user_id= '22222222-2222-2222-2222-222222222222'::uuid $$,
  NULL, '2A : un editor ne peut pas se promouvoir owner');

-- L'editor PEUT mettre à jour son invite_status (accepter) sans toucher au rôle
select lives_ok(
  $$ update public.entity_members set invite_status='accepted'
     where entity_id='aaaaaaaa-0000-0000-0000-000000000001' and user_id= '22222222-2222-2222-2222-222222222222'::uuid $$,
  '2A : un editor peut mettre à jour son invite_status sans changer de rôle');

-- ----------------------------------------------------------------------------
-- 2B — L'émetteur d'une demande de connexion NE PEUT PAS l'auto-accepter
-- ----------------------------------------------------------------------------
select tests.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into public.connections(from_user_id, to_user_id, status)
     values ('11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'pending') $$,
  '2B (setup) : demande de connexion créée en pending');

-- from_user tente d'accepter sa propre demande -> refus (RLS : seul to_user)
select throws_ok(
  $$ update public.connections set status='accepted'
     where from_user_id= '11111111-1111-1111-1111-111111111111'::uuid and to_user_id= '33333333-3333-3333-3333-333333333333'::uuid $$,
  NULL, '2B : l''émetteur ne peut pas auto-accepter la connexion');

-- Le destinataire PEUT accepter
select tests.act_as('33333333-3333-3333-3333-333333333333');
select lives_ok(
  $$ update public.connections set status='accepted'
     where from_user_id= '11111111-1111-1111-1111-111111111111'::uuid and to_user_id= '33333333-3333-3333-3333-333333333333'::uuid $$,
  '2B : le destinataire peut accepter la connexion');

-- ----------------------------------------------------------------------------
-- 2C — Un candidat à une mission NE PEUT PAS se mettre 'hired'
-- ----------------------------------------------------------------------------
-- Setup : une mission créée par u_owner, une candidature de u_third
select tests.act_as('11111111-1111-1111-1111-111111111111', '["publish_mission"]');
select lives_ok(
  $$ insert into public.missions(id, creator_id, title, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'::uuid, 'Sous-traitance Lyon', 'published') $$,
  '2C (setup) : mission créée');

select tests.act_as('33333333-3333-3333-3333-333333333333', '["access_subcontracting"]');
select lives_ok(
  $$ insert into public.mission_applications(id, mission_id, applicant_user_id, status)
     values ('cccccccc-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'::uuid, 'submitted') $$,
  '2C (setup) : candidature soumise');

-- Le candidat tente de se mettre 'hired' -> refus (with check = withdrawn seulement)
select throws_ok(
  $$ update public.mission_applications set status='hired'
     where id='cccccccc-0000-0000-0000-000000000001' $$,
  NULL, '2C : un candidat ne peut pas se mettre hired');

-- Le candidat PEUT se désister
select lives_ok(
  $$ update public.mission_applications set status='withdrawn'
     where id='cccccccc-0000-0000-0000-000000000001' $$,
  '2C : un candidat peut se désister (withdrawn)');

-- ----------------------------------------------------------------------------
-- 3B — recalc_entity_capabilities ne révoque pas un admin_grant manuel
-- ----------------------------------------------------------------------------
-- u_editor reçoit publish_job par admin_grant, sans entité vérifiée.
-- Contexte privilégié (setup) : l'écriture de user_capabilities exige admin_panel
-- côté RLS ; on repasse en rôle service pour poser la donnée de test.
set local role postgres;
insert into public.user_capabilities(user_id, capability, source)
  values ('22222222-2222-2222-2222-222222222222'::uuid, 'publish_job', 'admin_grant')
  on conflict (user_id, capability) do update set source='admin_grant', revoked_at=null;
select public.recalc_entity_capabilities('22222222-2222-2222-2222-222222222222'::uuid);
select is(
  (select revoked_at from public.user_capabilities
   where user_id= '22222222-2222-2222-2222-222222222222'::uuid and capability='publish_job'),
  NULL,
  '3B : recalc ne révoque pas un publish_job accordé par admin_grant');

-- ----------------------------------------------------------------------------
-- A — La modification d'une table fille réindexe l'entité (search_index à jour)
-- ----------------------------------------------------------------------------
-- (u_owner a créé l'entité + companies au setup 1A/1B ; ici on vérifie l'index)
insert into public.companies(entity_id, name, description)
  values ('aaaaaaaa-0000-0000-0000-000000000001','Net Lyon SARL','Nettoyage de bureaux à Lyon')
  on conflict (entity_id) do update set name=excluded.name, description=excluded.description;
select is(
  (select title from public.search_index where type='entity' and ref_id='aaaaaaaa-0000-0000-0000-000000000001'),
  'Net Lyon SARL',
  'A : la création/màj de companies réindexe l''entité (titre correct, pas « entité »)');

update public.companies set name='Net Lyon Pro'
  where entity_id='aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select title from public.search_index where type='entity' and ref_id='aaaaaaaa-0000-0000-0000-000000000001'),
  'Net Lyon Pro',
  'A : la mise à jour du nom de la société met à jour l''index de recherche');

-- ----------------------------------------------------------------------------
-- B — Un article publié puis soft-deleté n'est plus lisible en accès direct
-- ----------------------------------------------------------------------------
-- Setup service_role : créer un article publié de u_owner
set local role postgres;  -- contexte service (pas d'auth.uid)
insert into public.articles(id, author_id, title, slug, status, published_at)
  values ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
          'Guide propreté','guide-proprete','published', now())
  on conflict (id) do nothing;

-- Un tiers lit l'article publié : OK
select tests.act_as('33333333-3333-3333-3333-333333333333');
select isnt(
  (select count(*)::int from public.articles where id='dddddddd-0000-0000-0000-000000000001'),
  0, 'B : un article publié est lisible par un tiers');

-- Soft-delete de l'article (par l'auteur), puis un tiers ne doit plus le voir
select tests.act_as('11111111-1111-1111-1111-111111111111');
update public.articles set deleted_at=now(), status='published'
  where id='dddddddd-0000-0000-0000-000000000001';
select tests.act_as('33333333-3333-3333-3333-333333333333');
select is(
  (select count(*)::int from public.articles where id='dddddddd-0000-0000-0000-000000000001'),
  0, 'B : un article publié puis soft-deleté n''est plus lisible en accès direct par un tiers');

-- ----------------------------------------------------------------------------
-- Point 2 — Un membre d'entité PEUT uploader un média d'entité (logo/photo)
-- ----------------------------------------------------------------------------
-- u_owner est membre owner de l'entité aaaaaaaa...0001 (setup 1A/1B)
select tests.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into public.media(owner_type, owner_id, url, kind)
     values ('entity','aaaaaaaa-0000-0000-0000-000000000001','https://s/logo.png','logo') $$,
  'Point 2 : un membre d''entité peut insérer un média d''entité (logo)');

-- Un tiers non-membre NE PEUT PAS uploader un média sur cette entité
select tests.act_as('33333333-3333-3333-3333-333333333333');
select throws_ok(
  $$ insert into public.media(owner_type, owner_id, url, kind)
     values ('entity','aaaaaaaa-0000-0000-0000-000000000001','https://s/pirate.png','logo') $$,
  NULL, 'Point 2 (neg) : un non-membre ne peut pas insérer un média d''entité');

-- Un utilisateur peut uploader son propre média de profil (owner_type='profile')
select lives_ok(
  $$ insert into public.media(owner_type, owner_id, url, kind)
     values ('profile', '33333333-3333-3333-3333-333333333333'::uuid, 'https://s/avatar.png','avatar') $$,
  'Point 2 : un utilisateur peut insérer son propre média de profil');

select * from finish();
rollback;
