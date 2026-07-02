-- ============================================================================
-- ClubProprete.com — Schéma canonique (Phase 0) — PRD v9.0
-- Postgres / Supabase. Source unique de vérité du modèle de données.
-- 46 tables (39 fonctionnelles + 7 infrastructure).
-- ============================================================================

-- Les helpers SECURITY DEFINER (language sql) sont définis avant les tables
-- qu'ils référencent : on diffère la validation des corps de fonction (comme
-- pg_dump), sinon « relation does not exist » à la création. Résolution au run.
set check_function_bodies = off;

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto;     -- gen_random_uuid()
create extension if not exists postgis;      -- géo (geography point, distance)
create extension if not exists pg_trgm;      -- autocomplétion trigram
create extension if not exists unaccent;     -- recherche sans accents

-- ---------- ENUMS ----------
create type entity_type        as enum ('company','supplier','training_org','independent');
create type entity_status      as enum ('active','suspended','archived');
create type source_consent     as enum ('claimed','self','seed_unconsented');
create type verif_status       as enum ('draft','pending','approved','rejected');
create type claim_status       as enum ('pending','approved','rejected');
create type removal_status     as enum ('open','approved','rejected');
create type article_status     as enum ('draft','pending','published','rejected','archived');
create type job_status         as enum ('draft','published','closed','archived');
create type application_status as enum ('submitted','viewed','interview','hired','rejected','withdrawn');
create type membership_status  as enum ('pending','approved','rejected','revoked');
create type mission_status     as enum ('draft','published','closed','archived');
create type conversation_type  as enum ('direct','group');
create type member_role        as enum ('owner','manager','editor');
create type conv_member_role   as enum ('group_admin','member');
create type report_status      as enum ('open','dismissed','actioned');
create type mod_action         as enum ('dismiss','hide','warn','suspend','ban','delete');
create type mod_scope          as enum ('content','user');
create type notif_channel      as enum ('in_app','email','push');
create type queue_status       as enum ('pending','processing','delivered','failed');
create type visibility_level   as enum ('public','members','connections','private');
create type email_status       as enum ('sent','delivered','bounced','failed');

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER) — utilisées par les RLS pour éviter
-- la récursion de policies. Toutes en search_path verrouillé.
-- ============================================================================

-- has_capability : la capacité est-elle présente dans le JWT courant ?
-- 3A : opérateur de confinement @> (indexable, non ambigu — ce n'est PAS l'opérateur ? proscrit).
create or replace function public.has_capability(cap text)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'capabilities') @> jsonb_build_array(cap),
    false);
$$;

-- is_entity_member : l'utilisateur est-il membre (accepté) de l'entité ?
create or replace function public.is_entity_member(p_entity_id uuid, p_user_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entity_members m
    where m.entity_id = p_entity_id
      and m.user_id = p_user_id
      and m.invite_status = 'accepted'
  );
$$;

-- is_entity_owner : l'utilisateur est-il owner de l'entité ?
create or replace function public.is_entity_owner(p_entity_id uuid, p_user_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entity_members m
    where m.entity_id = p_entity_id
      and m.user_id = p_user_id
      and m.role = 'owner'
      and m.invite_status = 'accepted'
  );
$$;

-- is_conversation_participant : membre actif (non parti) de la conversation ?
create or replace function public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members c
    where c.conversation_id = p_conversation_id
      and c.user_id = p_user_id
      and c.left_at is null
  );
$$;

-- is_blocked : p_blocker a-t-il bloqué p_blocked ?
create or replace function public.is_blocked(p_blocker_id uuid, p_blocked_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks b
    where b.blocker_id = p_blocker_id
      and b.blocked_id = p_blocked_id
  );
$$;

-- entity_has_members : l'entité a-t-elle DÉJÀ au moins un membre ?
-- SECURITY DEFINER indispensable : utilisé dans la policy emembers_insert (1B).
-- Un sous-select inline serait filtré par la RLS de entity_members (le candidat
-- ne voit pas les membres existants) et laisserait un tiers s'auto-attribuer
-- owner sur une entité déjà possédée. Le helper contourne la RLS pour vérifier.
create or replace function public.entity_has_members(p_entity_id uuid)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entity_members m where m.entity_id = p_entity_id
  );
$$;

-- recalc_entity_capabilities (B5) : recalcule publish_job selon les entités vérifiées.
-- Si l'utilisateur n'a plus aucune entité vérifiée dont il est membre, révoque publish_job.
-- Sinon, garantit que publish_job est active. Appelée par F-06 (rejet/perte de vérif.) et F-19 (retrait entité).
create or replace function public.recalc_entity_capabilities(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_verified boolean;
begin
  select exists (
    select 1
    from public.entity_members m
    join public.entities e on e.id = m.entity_id
    where m.user_id = p_user_id
      and m.invite_status = 'accepted'
      and e.verified = true
      and e.deleted_at is null
      and e.status = 'active'
  ) into v_has_verified;

  if v_has_verified then
    -- réactive si présente et révoquée, sinon pose
    insert into public.user_capabilities(user_id, capability, source, granted_at, revoked_at)
    values (p_user_id, 'publish_job', 'role:verified_company', now(), null)
    on conflict (user_id, capability) do update
      set revoked_at = null, granted_at = now(), source = 'role:verified_company';
  else
    update public.user_capabilities
      set revoked_at = now()
    where user_id = p_user_id and capability = 'publish_job'
      and source = 'role:verified_company'          -- 3B : ne révoque pas un admin_grant manuel
      and revoked_at is null;
  end if;

  insert into public.audit_logs(actor_id, action, target_type, target_id, reason)
  values (p_user_id, 'recalc_capabilities', 'user', p_user_id,
          case when v_has_verified then 'publish_job actif' else 'publish_job révoqué' end);
end;
$$;

-- ============================================================================
-- TRIGGER GÉNÉRIQUE updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- BLOC 1 — IDENTITÉ, CAPACITÉS, COMPÉTENCES
-- ============================================================================

-- 1. profiles (PK = user_id, référence auth.users ; pas de colonne id distincte)
create table public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  first_name   text,
  last_name    text,
  slug         text unique not null,
  phone        text,
  headline     text,
  bio          text,
  photo_url    text,
  visibility   visibility_level not null default 'public',
  city_name    text,
  insee_code   text,
  postal_code  text,
  department   text,
  region       text,
  lat          double precision,
  lng          double precision,
  main_role    text not null default 'registered_user'
    check (main_role in ('registered_user','company_owner','verified_company',
      'supplier_owner','verified_supplier','training_org_owner','verified_training_org',
      'independent','verified_independent','candidate','author','admin','super_admin')),  -- V2
  current_entity_id uuid,   -- T5 : persiste le switcher d'entité (FK ajoutée après entities, cf. ALTER plus bas)
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_profiles_visibility on public.profiles(visibility) where deleted_at is null;
create index idx_profiles_insee on public.profiles(insee_code);
create index idx_profiles_slug_trgm on public.profiles using gin (slug gin_trgm_ops);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création de profil après signup (auth.users -> profiles)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Slug provisoire garanti unique : UUID complet (32 hex). Un préfixe
  -- tronqué peut collisionner (contrainte UNIQUE → signup en échec).
  -- L'utilisateur obtient un slug lisible à l'onboarding/édition de profil.
  insert into public.profiles (user_id, slug)
  values (new.id, 'u-' || replace(new.id::text,'-',''));
  return new;
end;
$$;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. user_capabilities (PK (user_id, capability) ; historique des cycles via audit_logs)
create table public.user_capabilities (
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  capability text not null,
  source     text not null,           -- 'default' | 'role:verified_company' | 'status:association_member' | 'admin_grant'
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, capability)
);
create index idx_user_capabilities_active on public.user_capabilities(user_id) where revoked_at is null;

-- 3. skills
create table public.skills (
  id     uuid primary key default gen_random_uuid(),
  label  text unique not null,
  family text
);

-- 4. profile_skills
create table public.profile_skills (
  profile_id uuid not null references public.profiles(user_id) on delete cascade,
  skill_id   uuid not null references public.skills(id) on delete cascade,
  primary key (profile_id, skill_id)
);

-- ============================================================================
-- BLOC 2 — ENTITÉS (parente + spécialisations) & MEMBRES
-- ============================================================================

-- 5. entities (parente)
create table public.entities (
  id             uuid primary key default gen_random_uuid(),
  type           entity_type not null,
  slug           text unique not null,
  status         entity_status not null default 'active',
  verified       boolean not null default false,
  source_consent source_consent not null default 'self',
  city_name      text,
  insee_code     text,
  postal_code    text,
  department     text,
  region         text,
  lat            double precision,
  lng            double precision,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_entities_lookup on public.entities(type, status, verified) where deleted_at is null;
create index idx_entities_insee on public.entities(insee_code);
create trigger trg_entities_updated before update on public.entities
  for each row execute function public.set_updated_at();

-- T5 : FK différée de profiles.current_entity_id (entities existe désormais)
alter table public.profiles
  add constraint fk_profiles_current_entity
  foreign key (current_entity_id) references public.entities(id) on delete set null;

-- 6. companies (PK = FK vers entities)
create table public.companies (
  entity_id           uuid primary key references public.entities(id) on delete cascade,
  name                text not null,
  legal_name          text,
  siret               text unique,
  legal_form          text,
  founded_year        int check (founded_year between 1800 and extract(year from now())::int),
  headcount           text,
  director_name       text,
  website             text,
  linkedin            text,
  google_maps_url     text,
  google_business_url text,
  address             text,
  service_areas       text[],
  intervention_radius int,
  segments            text[],
  description         text,              -- B2 : champ « Description » du score de complétion + recherche
  logo_url            text
);

-- 7. suppliers
create table public.suppliers (
  entity_id    uuid primary key references public.entities(id) on delete cascade,
  name         text not null,
  family       text not null,
  sub_category text not null,
  website      text,
  description  text,
  logo_url     text                  -- T2 : cohérence avec companies
);

-- 8. training_orgs (programs_text : texte libre, pas de catalogue structuré — décision v9)
create table public.training_orgs (
  entity_id      uuid primary key references public.entities(id) on delete cascade,
  name           text not null,
  certifications text[],
  website        text,
  logo_url       text,                -- T2 : cohérence avec companies
  programs_text  text                -- « formations proposées » en texte libre
);

-- 9. independents
create table public.independents (
  entity_id     uuid primary key references public.entities(id) on delete cascade,
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  headline      text,
  service_areas text[]
);

-- 10. company_services (services validés serveur vs énum)
create table public.company_services (
  id           uuid primary key default gen_random_uuid(),
  entity_id    uuid not null references public.entities(id) on delete cascade,
  service_type text not null,
  unique (entity_id, service_type)
);
create index idx_company_services_entity on public.company_services(entity_id);

-- 11. entity_members (co-gestion ; FK propre)
create table public.entity_members (
  id            uuid primary key default gen_random_uuid(),
  entity_id     uuid not null references public.entities(id) on delete cascade,
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  role          member_role not null default 'owner',
  invited_by    uuid references public.profiles(user_id) on delete set null,
  invite_status text not null default 'accepted' check (invite_status in ('pending','accepted')),  -- V3 : text+check volontaire (binaire, pas d'enum)
  created_at    timestamptz not null default now(),
  unique (entity_id, user_id)
);
create index idx_entity_members_user on public.entity_members(user_id);

-- 2A : empêche un membre non-owner de modifier son propre champ role (élévation editor -> owner).
-- Seuls un owner de l'entité ou un modérateur peuvent changer un role.
create or replace function public.guard_member_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- D : laisser passer les scripts de maintenance hors contexte utilisateur (service_role / auth.uid() NULL)
  if auth.uid() is null or current_setting('role', true) = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    if not ( public.is_entity_owner(old.entity_id, auth.uid())
             or public.has_capability('moderate') ) then
      raise exception 'Seul un owner ou un modérateur peut modifier le rôle d''un membre';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_guard_member_role
  before update on public.entity_members
  for each row execute function public.guard_member_role();

-- ============================================================================
-- BLOC 3 — DEMANDES (vérification, claim, retrait)
-- ============================================================================

-- 12. verification_requests
create table public.verification_requests (
  id              uuid primary key default gen_random_uuid(),
  entity_id       uuid not null references public.entities(id) on delete cascade,
  status          verif_status not null default 'pending',
  seniority       text,
  headcount       text,
  requested_slots jsonb,
  decided_by      uuid references public.profiles(user_id) on delete set null,
  reason          text,
  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);
create index idx_verif_status on public.verification_requests(status);

-- 13. claim_requests
create table public.claim_requests (
  id         uuid primary key default gen_random_uuid(),
  entity_id  uuid not null references public.entities(id) on delete cascade,
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  status     claim_status not null default 'pending',
  proof      text,
  reason     text,
  decided_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- 14. entity_removal_requests (droit d'opposition — fiches tierces)
create table public.entity_removal_requests (
  id             uuid primary key default gen_random_uuid(),
  entity_id      uuid not null references public.entities(id) on delete cascade,
  requester_email text not null,
  requester_role text,
  proof          text,
  status         removal_status not null default 'open',
  decided_by     uuid references public.profiles(user_id) on delete set null,
  reason         text,
  created_at     timestamptz not null default now(),
  decided_at     timestamptz
);

-- ============================================================================
-- BLOC 4 — ÉDITORIAL
-- ============================================================================

-- 15. article_categories
create table public.article_categories (
  id    uuid primary key default gen_random_uuid(),
  label text not null,
  slug  text unique not null
);

-- 16. articles
create table public.articles (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles(user_id) on delete cascade,
  title             text not null,
  slug              text unique not null,
  excerpt           text,
  content           text,
  featured_image    text,
  category_id       uuid references public.article_categories(id) on delete set null,
  status            article_status not null default 'draft',
  parent_article_id uuid references public.articles(id) on delete set null,
  published_at      timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_articles_status on public.articles(status) where deleted_at is null;
create index idx_articles_author on public.articles(author_id);
create trigger trg_articles_updated before update on public.articles
  for each row execute function public.set_updated_at();

-- 17. author_applications
create table public.author_applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  expertise  text,
  motivation text,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),  -- V4 : text+check volontaire
  reason     text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- ============================================================================
-- BLOC 5 — EMPLOI & SOUS-TRAITANCE
-- ============================================================================

-- 18. jobs
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  entity_id     uuid not null references public.entities(id) on delete cascade,
  title         text not null,
  slug          text unique not null,          -- B1 : route /emploi/{slug} ; généré applicatif (slugify(title)+hash court) avant insert
  contract_type text,                           -- référentiel fermé : cf. Annexe G (CDI, CDD, Freelance, Stage, Alternance)
  city_name     text,
  insee_code    text,
  region        text,
  lat           double precision,               -- T1 : recherche d'emploi géolocalisée
  lng           double precision,               -- T1
  description   text,
  skills        text[],
  status        job_status not null default 'draft',
  expires_at    timestamptz,
  published_at  timestamptz,
  closed_at     timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_jobs_status on public.jobs(status) where deleted_at is null;
create index idx_jobs_entity on public.jobs(entity_id);
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();

-- 19. job_applications
create table public.job_applications (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references public.jobs(id) on delete cascade,
  candidate_profile_id uuid not null references public.profiles(user_id) on delete cascade,
  cv_url               text,
  message              text,
  status               application_status not null default 'submitted',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (job_id, candidate_profile_id)
);
create trigger trg_job_applications_updated before update on public.job_applications
  for each row execute function public.set_updated_at();

-- 20. job_alerts
create table public.job_alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  role_query text,
  area       text,
  frequency  text not null default 'daily' check (frequency in ('daily','weekly')),
  created_at timestamptz not null default now()
);

-- 21. association_memberships
create table public.association_memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  status       membership_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by   uuid references public.profiles(user_id) on delete set null,
  reason       text,
  decided_at   timestamptz,
  unique (user_id)
);

-- 22. missions
create table public.missions (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.profiles(user_id) on delete cascade,
  title       text not null,
  description text,
  city_name   text,
  insee_code  text,
  region      text,
  status      mission_status not null default 'draft',
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_missions_updated before update on public.missions
  for each row execute function public.set_updated_at();

-- 23. mission_applications
create table public.mission_applications (
  id               uuid primary key default gen_random_uuid(),
  mission_id       uuid not null references public.missions(id) on delete cascade,
  applicant_user_id uuid not null references public.profiles(user_id) on delete cascade,
  status           application_status not null default 'submitted',
  created_at       timestamptz not null default now(),
  unique (mission_id, applicant_user_id)
);
-- ============================================================================
-- BLOC 6 — GRAPHE SOCIAL & MESSAGERIE
-- ============================================================================

-- 24. connections
create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id   uuid not null references public.profiles(user_id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted')),  -- V5 : text+check volontaire
  created_at   timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);
create index idx_connections_to on public.connections(to_user_id);

-- 25. follows
create table public.follows (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id   uuid not null references public.profiles(user_id) on delete cascade,
  created_at   timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

-- 26. recommendations
create table public.recommendations (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id   uuid not null references public.profiles(user_id) on delete cascade,
  quality      text,
  text         text,
  created_at   timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);
create index idx_recommendations_to on public.recommendations(to_user_id);

-- 27. conversations
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  type       conversation_type not null default 'direct',
  title      text,
  direct_key text unique,   -- empêche deux conversations 'direct' entre les 2 mêmes users (cf. trigger)
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_conversations_updated before update on public.conversations
  for each row execute function public.set_updated_at();

-- 28. conversation_members
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(user_id) on delete cascade,
  role            conv_member_role not null default 'member',
  last_read_at    timestamptz,
  left_at         timestamptz,
  primary key (conversation_id, user_id)
);

-- direct_key : clé déterministe = least(u1,u2)||'_'||greatest(u1,u2) pour les conversations 'direct'.
-- C : la clé est CALCULÉE en base à partir des 2 membres réels (pas seulement côté appli),
-- ce qui empêche une clé A_B associée à des membres A et C. UNIQUE garantit l'unicité.
create or replace function public.enforce_direct_two_members()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type conversation_type;
  v_count int;
  v_members uuid[];
  v_key text;
begin
  select type into v_type from public.conversations where id = new.conversation_id;
  if v_type = 'direct' then
    select count(*), array_agg(user_id order by user_id)
      into v_count, v_members
      from public.conversation_members
      where conversation_id = new.conversation_id;
    if v_count > 2 then
      raise exception 'Une conversation directe ne peut avoir que 2 membres';
    end if;
    -- quand les 2 membres sont présents, (re)calcule et fige la clé canonique en base
    if v_count = 2 then
      v_key := v_members[1]::text || '_' || v_members[2]::text;
      update public.conversations set direct_key = v_key where id = new.conversation_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_direct_two_members
  after insert on public.conversation_members
  for each row execute function public.enforce_direct_two_members();

-- 29. messages
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(user_id) on delete cascade,
  body            text,
  flagged         boolean not null default false,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);
create index idx_messages_conv on public.messages(conversation_id, created_at);

-- 30. message_attachments (limite applicative : 5 par message — vérifiée serveur)
create table public.message_attachments (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  url        text not null,
  kind       text,
  size_bytes bigint check (size_bytes <= 5242880)   -- 5 Mo
);
create index idx_attachments_message on public.message_attachments(message_id);

-- 31. blocks
create table public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

-- ============================================================================
-- BLOC 7 — NOTIFICATIONS, MODÉRATION, MÉDIAS, AUDIT
-- ============================================================================

-- 32. notifications
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);

-- 33. notification_preferences
create table public.notification_preferences (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type    text not null,
  channel notif_channel not null,
  enabled boolean not null default true,
  primary key (user_id, type, channel)
);

-- 34. reports
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  target_type text not null check (target_type in ('article','profile','message','recommendation','entity')),
  target_id   uuid not null,
  reason      text,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now()
);
create index idx_reports_status on public.reports(status);

-- 35. moderation_decisions (immuable)
create table public.moderation_decisions (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid references public.reports(id) on delete set null,
  target_type    text not null,
  target_id      uuid not null,
  moderator_id   uuid not null references public.profiles(user_id) on delete set null,
  action         mod_action not null,
  scope          mod_scope not null default 'content',
  duration_hours int,
  reason         text not null,
  created_at     timestamptz not null default now()
);

-- 36. media
create table public.media (
  id         uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id   uuid not null,
  url        text not null,
  kind       text,
  ord        int default 0,
  created_at timestamptz not null default now()
);
create index idx_media_owner on public.media(owner_type, owner_id);

-- 37. audit_logs (immuable, partitionnable par created_at)
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(user_id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  reason      text,
  created_at  timestamptz not null default now()
);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ============================================================================
-- BLOC 8 — RESSOURCES TÉLÉCHARGEABLES (M09 — décision v9 : conservé)
-- ============================================================================

-- 38. resources
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  description text,
  file_url    text not null,
  kind        text,           -- 'docx','pdf',...
  cover_image text,           -- T6 : visuel de la card ressource (optionnel)
  audience    text,
  status      text not null default 'draft' check (status in ('draft','published')),
  created_by  uuid references public.profiles(user_id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_resources_updated before update on public.resources
  for each row execute function public.set_updated_at();

-- 39. resource_downloads (lead léger : email + ressource, sans table leads dédiée)
create table public.resource_downloads (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id     uuid references public.profiles(user_id) on delete set null,
  email       text,
  created_at  timestamptz not null default now()
);
create index idx_resource_downloads_resource on public.resource_downloads(resource_id);

-- ============================================================================
-- BLOC 9 — INFRASTRUCTURE (7 tables, service_role)
-- ============================================================================

-- 40. search_index
create table public.search_index (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('entity','profile','article','job')),
  ref_id     uuid not null,
  title      text,
  content    text,
  geo_point  geography(point),
  filters    jsonb,
  tsv        tsvector,
  updated_at timestamptz not null default now(),
  unique (type, ref_id)
);
create index idx_search_tsv on public.search_index using gin(tsv);
create index idx_search_geo on public.search_index using gist(geo_point);
create index idx_search_filters on public.search_index using gin(filters);
create index idx_search_title_trgm on public.search_index using gin (title gin_trgm_ops);

-- 41. seo_metadata
create table public.seo_metadata (
  id          uuid primary key default gen_random_uuid(),
  page_type   text not null,
  ref_id      uuid,
  title       text,
  description text,
  og_image    text,
  schema_type text
);

-- 42. slug_history (301)
create table public.slug_history (
  old_slug        text primary key,
  entity_type     text not null check (entity_type in ('profile','entity','article')),
  ref_id          uuid not null,
  redirect_to_slug text not null,
  created_at      timestamptz not null default now()
);

-- 43. email_deliveries
create table public.email_deliveries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(user_id) on delete set null,
  template    text not null,
  to_email    text not null,
  status      email_status not null default 'sent',
  provider_id text,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_email_deliveries_updated before update on public.email_deliveries
  for each row execute function public.set_updated_at();

-- 44. notification_queue
create table public.notification_queue (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  channel      notif_channel not null,
  type         text not null,
  payload      jsonb not null default '{}'::jsonb,
  status       queue_status not null default 'pending',
  retry_count  int not null default 0,
  scheduled_at timestamptz not null default now(),
  processed_at timestamptz,
  error        text
);
create index idx_queue_pending on public.notification_queue(scheduled_at) where status = 'pending';

-- 45. rate_limits
create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        int not null default 0
);

-- 46. user_sessions
create table public.user_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  ip         text,
  user_agent text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index idx_user_sessions_user on public.user_sessions(user_id);

-- ============================================================================
-- TRIGGERS search_index (alimentation source -> index)
-- ============================================================================

-- entities -> search_index
-- Réindexation d'une entité (A) : lit tout à frais (parente + spécialisation).
-- Appelée par le trigger sur entities ET par les triggers sur les tables filles,
-- ce qui corrige (1) la course à la création (la fille existe quand le trigger fille part)
-- et (2) l'oubli de mise à jour quand seul le nom/description de la fille change.
create or replace function public.reindex_entity(p_entity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  e record; v_name text; v_desc text;
begin
  select * into e from public.entities where id = p_entity_id;
  if not found then
    delete from public.search_index where type='entity' and ref_id = p_entity_id;
    return;
  end if;
  if e.status <> 'active' or e.deleted_at is not null then
    delete from public.search_index where type='entity' and ref_id = p_entity_id;
    return;
  end if;
  select coalesce(c.name, s.name, t.name, i.headline, 'entité'),
         coalesce(c.description, s.description, t.programs_text, i.headline, '')
    into v_name, v_desc
  from public.entities en
  left join public.companies c     on c.entity_id = en.id
  left join public.suppliers s     on s.entity_id = en.id
  left join public.training_orgs t on t.entity_id = en.id
  left join public.independents i  on i.entity_id = en.id
  where en.id = p_entity_id;

  insert into public.search_index(type, ref_id, title, content, geo_point, filters, tsv, updated_at)
  values ('entity', p_entity_id, v_name, v_desc,
          case when e.lng is not null and e.lat is not null
               then st_setsrid(st_makepoint(e.lng, e.lat),4326)::geography end,
          jsonb_build_object('type', e.type, 'verified', e.verified, 'region', e.region),
          to_tsvector('french', unaccent(coalesce(v_name,'') || ' ' || coalesce(v_desc,''))),
          now())
  on conflict (type, ref_id) do update
    set title=excluded.title, content=excluded.content, geo_point=excluded.geo_point,
        filters=excluded.filters, tsv=excluded.tsv, updated_at=now();
end;
$$;

-- Trigger sur entities (parente)
create or replace function public.sync_search_entity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'DELETE') then
    delete from public.search_index where type='entity' and ref_id = old.id;
    return old;
  end if;
  perform public.reindex_entity(new.id);
  return new;
end;
$$;
create trigger trg_search_entity
  after insert or update or delete on public.entities
  for each row execute function public.sync_search_entity();

-- Triggers sur les tables filles (A) : toute modif de nom/description/… réindexe l'entité parente.
create or replace function public.sync_search_entity_child()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'DELETE') then
    perform public.reindex_entity(old.entity_id);
    return old;
  end if;
  perform public.reindex_entity(new.entity_id);
  return new;
end;
$$;
create trigger trg_search_company   after insert or update or delete on public.companies
  for each row execute function public.sync_search_entity_child();
create trigger trg_search_supplier  after insert or update or delete on public.suppliers
  for each row execute function public.sync_search_entity_child();
create trigger trg_search_training  after insert or update or delete on public.training_orgs
  for each row execute function public.sync_search_entity_child();
create trigger trg_search_independent after insert or update or delete on public.independents
  for each row execute function public.sync_search_entity_child();


-- profiles -> search_index (public uniquement)
create or replace function public.sync_search_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP = 'DELETE') then
    delete from public.search_index where type='profile' and ref_id = old.user_id; return old;
  end if;
  if new.visibility <> 'public' or new.deleted_at is not null then
    delete from public.search_index where type='profile' and ref_id = new.user_id; return new;
  end if;
  insert into public.search_index(type, ref_id, title, content, geo_point, filters, tsv, updated_at)
  values ('profile', new.user_id,
          trim(coalesce(new.first_name,'')||' '||coalesce(new.last_name,'')),
          coalesce(new.headline,'')||' '||coalesce(new.bio,''),
          case when new.lng is not null and new.lat is not null
               then st_setsrid(st_makepoint(new.lng,new.lat),4326)::geography end,
          jsonb_build_object('region', new.region),
          to_tsvector('french', unaccent(coalesce(new.first_name,'')||' '||coalesce(new.last_name,'')||' '||coalesce(new.headline,'')||' '||coalesce(new.bio,''))),
          now())
  on conflict (type, ref_id) do update
    set title=excluded.title, content=excluded.content, geo_point=excluded.geo_point,
        filters=excluded.filters, tsv=excluded.tsv, updated_at=now();
  return new;
end;
$$;
create trigger trg_search_profile
  after insert or update or delete on public.profiles
  for each row execute function public.sync_search_profile();

-- articles -> search_index (published) & jobs -> search_index (published & non expirées)
create or replace function public.sync_search_article()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP='DELETE') then delete from public.search_index where type='article' and ref_id=old.id; return old; end if;
  if new.status <> 'published' or new.deleted_at is not null then delete from public.search_index where type='article' and ref_id=new.id; return new; end if;  -- B3
  insert into public.search_index(type, ref_id, title, content, filters, tsv, updated_at)
  values ('article', new.id, new.title, coalesce(new.excerpt,''),
          jsonb_build_object('category', new.category_id),
          to_tsvector('french', unaccent(coalesce(new.title,'')||' '||coalesce(new.excerpt,''))), now())
  on conflict (type, ref_id) do update
    set title=excluded.title, content=excluded.content, filters=excluded.filters, tsv=excluded.tsv, updated_at=now();
  return new;
end;
$$;
create trigger trg_search_article
  after insert or update or delete on public.articles
  for each row execute function public.sync_search_article();

create or replace function public.sync_search_job()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (TG_OP='DELETE') then delete from public.search_index where type='job' and ref_id=old.id; return old; end if;
  if new.status <> 'published' or new.deleted_at is not null or (new.expires_at is not null and new.expires_at <= now()) then  -- B3
    delete from public.search_index where type='job' and ref_id=new.id; return new;
  end if;
  insert into public.search_index(type, ref_id, title, content, geo_point, filters, tsv, updated_at)
  values ('job', new.id, new.title, coalesce(new.description,''),
          case when new.lng is not null and new.lat is not null                       -- T1 : géo emploi
               then st_setsrid(st_makepoint(new.lng, new.lat),4326)::geography end,
          jsonb_build_object('contract_type', new.contract_type, 'region', new.region),
          to_tsvector('french', unaccent(coalesce(new.title,'')||' '||coalesce(new.description,''))), now())
  on conflict (type, ref_id) do update
    set title=excluded.title, content=excluded.content, geo_point=excluded.geo_point,
        filters=excluded.filters, tsv=excluded.tsv, updated_at=now();
  return new;
end;
$$;
create trigger trg_search_job
  after insert or update or delete on public.jobs
  for each row execute function public.sync_search_job();
