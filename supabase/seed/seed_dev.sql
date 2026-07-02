-- ============================================================================
-- ClubProprete.com — Seed DEV/STAGING : amorçage anti « réseau vide » (R1)
-- Objectif MVP 1 : 200 profils · 80 fiches (mix des 4 types) · 50 vérifiées.
-- Idempotent (UUID déterministes + on conflict). À NE PAS charger en prod
-- avec de vrais utilisateurs. Exécuter APRÈS 0001/0002/0003.
--   psql "$DATABASE_URL" -f supabase/seed/seed_dev.sql
-- ============================================================================

set client_min_messages = warning;

-- ---------- Référentiel de compétences (table skills, écriture admin) -------
insert into public.skills (id, label, family) values
  (gen_random_uuid(), 'Nettoyage de bureaux', 'technique'),
  (gen_random_uuid(), 'Vitrerie', 'technique'),
  (gen_random_uuid(), 'Remise en état', 'technique'),
  (gen_random_uuid(), 'Décapage et pose d''émulsion', 'technique'),
  (gen_random_uuid(), 'Cristallisation marbre', 'technique'),
  (gen_random_uuid(), 'Bionettoyage hospitalier', 'technique'),
  (gen_random_uuid(), 'Nettoyage agroalimentaire', 'technique'),
  (gen_random_uuid(), 'Haute pression', 'technique'),
  (gen_random_uuid(), 'Gestion d''équipe', 'management'),
  (gen_random_uuid(), 'Contrôle qualité', 'management'),
  (gen_random_uuid(), 'Chiffrage de devis', 'gestion'),
  (gen_random_uuid(), 'Relation client', 'gestion'),
  (gen_random_uuid(), 'CACES nacelle', 'certification'),
  (gen_random_uuid(), 'SST', 'certification'),
  (gen_random_uuid(), 'Cordiste', 'technique')
on conflict (label) do nothing;

-- ---------- 200 profils ------------------------------------------------------
-- Villes réelles normalisées (INSEE, CP, département, région, lat, lng).
with cities(city_name, insee, cp, dept, region, lat, lng) as (
  values
    ('Paris','75056','75001','Paris','Île-de-France',48.8566,2.3522),
    ('Lyon','69123','69001','Rhône','Auvergne-Rhône-Alpes',45.7640,4.8357),
    ('Marseille','13055','13001','Bouches-du-Rhône','Provence-Alpes-Côte d''Azur',43.2965,5.3698),
    ('Lille','59350','59000','Nord','Hauts-de-France',50.6292,3.0573),
    ('Nantes','44109','44000','Loire-Atlantique','Pays de la Loire',47.2184,-1.5536),
    ('Bordeaux','33063','33000','Gironde','Nouvelle-Aquitaine',44.8378,-0.5792),
    ('Toulouse','31555','31000','Haute-Garonne','Occitanie',43.6047,1.4442),
    ('Strasbourg','67482','67000','Bas-Rhin','Grand Est',48.5734,7.7521),
    ('Rennes','35238','35000','Ille-et-Vilaine','Bretagne',48.1173,-1.6778),
    ('Nice','06088','06000','Alpes-Maritimes','Provence-Alpes-Côte d''Azur',43.7102,7.2620)
),
firstnames(fn) as (
  values ('Camille'),('Nicolas'),('Sophie'),('Karim'),('Julie'),('Thomas'),('Fatou'),
         ('Antoine'),('Léa'),('Mehdi'),('Claire'),('Julien'),('Awa'),('Pierre'),
         ('Manon'),('David'),('Sarah'),('Romain'),('Inès'),('Laurent')
),
lastnames(ln) as (
  values ('Martin'),('Bernard'),('Diallo'),('Petit'),('Robert'),('Nguyen'),('Richard'),
         ('Garcia'),('Moreau'),('Benali')
),
gen as (
  select
    n,
    ('00000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid as uid,
    (select fn from firstnames offset (n % 20) limit 1)  as first_name,
    (select ln from lastnames  offset (n % 10) limit 1)  as last_name,
    (select c from cities c offset (n % 10) limit 1)     as city
  from generate_series(1, 200) as n
)
insert into auth.users (id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select uid,
       'seed-user-' || n || '@dev.clubproprete.local',
       'authenticated', 'authenticated', now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
from gen
on conflict (id) do nothing;

-- Le trigger handle_new_user a créé les profils ; on les complète.
with cities(city_name, insee, cp, dept, region, lat, lng) as (
  values
    ('Paris','75056','75001','Paris','Île-de-France',48.8566,2.3522),
    ('Lyon','69123','69001','Rhône','Auvergne-Rhône-Alpes',45.7640,4.8357),
    ('Marseille','13055','13001','Bouches-du-Rhône','Provence-Alpes-Côte d''Azur',43.2965,5.3698),
    ('Lille','59350','59000','Nord','Hauts-de-France',50.6292,3.0573),
    ('Nantes','44109','44000','Loire-Atlantique','Pays de la Loire',47.2184,-1.5536),
    ('Bordeaux','33063','33000','Gironde','Nouvelle-Aquitaine',44.8378,-0.5792),
    ('Toulouse','31555','31000','Haute-Garonne','Occitanie',43.6047,1.4442),
    ('Strasbourg','67482','67000','Bas-Rhin','Grand Est',48.5734,7.7521),
    ('Rennes','35238','35000','Ille-et-Vilaine','Bretagne',48.1173,-1.6778),
    ('Nice','06088','06000','Alpes-Maritimes','Provence-Alpes-Côte d''Azur',43.7102,7.2620)
),
firstnames(fn) as (
  values ('Camille'),('Nicolas'),('Sophie'),('Karim'),('Julie'),('Thomas'),('Fatou'),
         ('Antoine'),('Léa'),('Mehdi'),('Claire'),('Julien'),('Awa'),('Pierre'),
         ('Manon'),('David'),('Sarah'),('Romain'),('Inès'),('Laurent')
),
lastnames(ln) as (
  values ('Martin'),('Bernard'),('Diallo'),('Petit'),('Robert'),('Nguyen'),('Richard'),
         ('Garcia'),('Moreau'),('Benali')
),
gen as (
  select n,
    ('00000000-0000-4000-a000-' || lpad(n::text, 12, '0'))::uuid as uid,
    (select fn from firstnames offset (n % 20) limit 1) as first_name,
    (select ln from lastnames  offset (n % 10) limit 1) as last_name,
    (select row(c.*)::record from cities c offset (n % 10) limit 1) as _ignore,
    (select c.city_name from cities c offset (n % 10) limit 1) as city_name,
    (select c.insee     from cities c offset (n % 10) limit 1) as insee,
    (select c.cp        from cities c offset (n % 10) limit 1) as cp,
    (select c.dept      from cities c offset (n % 10) limit 1) as dept,
    (select c.region    from cities c offset (n % 10) limit 1) as region,
    (select c.lat       from cities c offset (n % 10) limit 1) as lat,
    (select c.lng       from cities c offset (n % 10) limit 1) as lng
  from generate_series(1, 200) as n
)
update public.profiles p set
  first_name = g.first_name,
  last_name  = g.last_name,
  slug       = 'seed-' || lower(g.first_name) || '-' || lower(g.last_name) || '-' || g.n,
  headline   = case (g.n % 4)
                 when 0 then 'Dirigeant d''entreprise de propreté'
                 when 1 then 'Agent de service polyvalent'
                 when 2 then 'Chef d''équipe nettoyage'
                 else 'Indépendant multi-services'
               end,
  city_name = g.city_name, insee_code = g.insee, postal_code = g.cp,
  department = g.dept, region = g.region, lat = g.lat, lng = g.lng,
  main_role = case when (g.n % 5) < 2 then 'company_owner'
                   when (g.n % 5) = 2 then 'independent'
                   when (g.n % 5) = 3 then 'candidate'
                   else 'registered_user' end
from gen g
where p.user_id = g.uid;

-- ---------- 80 entités (50 sociétés, 15 fournisseurs, 8 centres, 7 indép.) ---
with gen as (
  select n,
    ('00000000-0000-4000-b000-' || lpad(n::text, 12, '0'))::uuid as eid,
    ('00000000-0000-4000-a000-' || lpad(((n - 1) % 200 + 1)::text, 12, '0'))::uuid as owner_uid,
    case when n <= 50 then 'company'
         when n <= 65 then 'supplier'
         when n <= 73 then 'training_org'
         else 'independent' end as etype,
    n <= 50 and n % 50 < 43 or n between 51 and 57 as _unused
  from generate_series(1, 80) as n
)
insert into public.entities (id, type, slug, status, verified, source_consent,
                             city_name, insee_code, postal_code, department, region, lat, lng)
select g.eid, g.etype::entity_type,
       'seed-' || g.etype || '-' || g.n,
       'active',
       g.n <= 50,                       -- les 50 premières (sociétés) vérifiées
       case when g.n % 3 = 0 then 'seed_unconsented' else 'self' end::source_consent,
       p.city_name, p.insee_code, p.postal_code, p.department, p.region, p.lat, p.lng
from gen g
join public.profiles p on p.user_id = g.owner_uid
on conflict (id) do nothing;

-- Membres owners
insert into public.entity_members (entity_id, user_id, role, invite_status)
select ('00000000-0000-4000-b000-' || lpad(n::text, 12, '0'))::uuid,
       ('00000000-0000-4000-a000-' || lpad(((n - 1) % 200 + 1)::text, 12, '0'))::uuid,
       'owner', 'accepted'
from generate_series(1, 80) as n
on conflict (entity_id, user_id) do nothing;

-- Tables filles
insert into public.companies (entity_id, name, siret, description, website, segments, service_areas)
select e.id,
       'Propreté ' || initcap(split_part(e.slug, '-', 3)) || ' ' || e.city_name,
       lpad((10000000000000 + (row_number() over (order by e.id)))::text, 14, '0'),
       'Entreprise de propreté implantée à ' || e.city_name ||
         '. Interventions en bureaux, copropriétés et sites tertiaires, équipes formées et encadrées.',
       'https://exemple-proprete.fr',
       array['bureaux','coproprietes'],
       array[e.city_name, e.department]
from public.entities e
where e.type = 'company' and e.slug like 'seed-company-%'
on conflict (entity_id) do nothing;

insert into public.company_services (entity_id, service_type)
select e.id, s.service_type
from public.entities e
cross join lateral (
  values ('nettoyage_bureaux'), ('entretien_courant'), ('nettoyage_vitres')
) as s(service_type)
where e.type = 'company' and e.slug like 'seed-company-%'
on conflict (entity_id, service_type) do nothing;

insert into public.suppliers (entity_id, name, family, sub_category, description, website)
select e.id,
       'Équipements ' || e.city_name,
       (array['machines','produits_chimiques','consommables','materiel_manuel','logiciels'])[1 + (row_number() over (order by e.id)) % 5],
       (array['autolaveuses','detergents','essuyage','chariots','gestion_planning'])[1 + (row_number() over (order by e.id)) % 5],
       'Distributeur de matériel et consommables pour les professionnels de la propreté.',
       'https://exemple-fournisseur.fr'
from public.entities e
where e.type = 'supplier' and e.slug like 'seed-supplier-%'
on conflict (entity_id) do nothing;

insert into public.training_orgs (entity_id, name, certifications, programs_text, website)
select e.id,
       'Institut Propreté ' || e.city_name,
       array['Qualiopi','CQP_proprete'],
       'CQP Agent machiniste classique — CQP Chef d''équipe — Habilitations et SST. Sessions inter et intra-entreprises.',
       'https://exemple-formation.fr'
from public.entities e
where e.type = 'training_org' and e.slug like 'seed-training_org-%'
on conflict (entity_id) do nothing;

insert into public.independents (entity_id, user_id, headline, service_areas)
select e.id, m.user_id,
       'Indépendant propreté — ' || e.city_name,
       array[e.city_name, e.department]
from public.entities e
join public.entity_members m on m.entity_id = e.id and m.role = 'owner'
where e.type = 'independent' and e.slug like 'seed-independent-%'
on conflict (entity_id) do nothing;

-- Capacité publish_job pour les owners d'entités vérifiées (cycle nominal B5)
select public.recalc_entity_capabilities(m.user_id)
from public.entity_members m
join public.entities e on e.id = m.entity_id
where e.verified and e.slug like 'seed-%';

-- ---------- Index de recherche ----------------------------------------------
select public.rebuild_search_index();

-- ---------- Contrôles --------------------------------------------------------
do $$
declare v_profiles int; v_entities int; v_verified int; v_index int;
begin
  select count(*) into v_profiles from public.profiles where slug like 'seed-%';
  select count(*) into v_entities from public.entities where slug like 'seed-%';
  select count(*) into v_verified from public.entities where slug like 'seed-%' and verified;
  select count(*) into v_index from public.search_index;
  raise notice 'SEED — profils: %, entités: %, vérifiées: %, search_index: %',
    v_profiles, v_entities, v_verified, v_index;
  if v_profiles < 200 or v_entities < 80 or v_verified < 50 then
    raise exception 'Seed incomplet (attendu 200/80/50)';
  end if;
end $$;
