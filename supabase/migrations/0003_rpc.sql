-- ============================================================================
-- ClubProprete.com — 0003 : RPC d'agrégation (anti N+1, PRD 19.1/19.5)
-- Annuaire (keyset), autocomplétion (pg_trgm), score de complétion (10.1),
-- reconstruction complète de l'index (19.5).
-- Lecture publique : SECURITY INVOKER (la RLS des tables sources s'applique).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- search_directory — annuaire par type + filtres service/région/vérifié + texte.
-- Pagination KEYSET sur (score desc, id asc) — jamais d'OFFSET (PRD 19.1).
-- Tri : pertinence plein-texte si p_q, sinon fiches vérifiées d'abord.
-- ----------------------------------------------------------------------------
create or replace function public.search_directory(
  p_type         entity_type,
  p_service      text default null,
  p_region       text default null,
  p_verified     boolean default false,
  p_q            text default null,
  p_cursor_score double precision default null,
  p_cursor_id    uuid default null,
  p_limit        int default 20
)
returns table (
  entity_id   uuid,
  slug        text,
  title       text,
  description text,
  city_name   text,
  department  text,
  region      text,
  verified    boolean,
  score       double precision
)
language sql stable
as $$
  with q as (
    select case when p_q is null or length(trim(p_q)) = 0 then null
                else websearch_to_tsquery('french', unaccent(p_q)) end as tsq
  ),
  scored as (
    select e.id as entity_id, e.slug, si.title, si.content as description,
           e.city_name, e.department, e.region, e.verified,
           case when (select tsq from q) is null
                then e.verified::int::double precision
                else ts_rank(si.tsv, (select tsq from q))::double precision
           end as score
    from public.entities e
    join public.search_index si on si.type = 'entity' and si.ref_id = e.id
    where e.status = 'active' and e.deleted_at is null
      and e.type = p_type
      and (p_region is null or e.region = p_region)
      and (not p_verified or e.verified)
      and (p_service is null or exists (
             select 1 from public.company_services cs
             where cs.entity_id = e.id and cs.service_type = p_service))
      and ((select tsq from q) is null or si.tsv @@ (select tsq from q))
  )
  select * from scored
  where p_cursor_score is null
     or score < p_cursor_score
     or (score = p_cursor_score and entity_id > p_cursor_id)
  order by score desc, entity_id asc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ----------------------------------------------------------------------------
-- search_suggest — autocomplétion préfixe/trigram sur les titres (PRD 19.5).
-- Débouncée côté client, rate-limitée côté serveur (search_anon 120/min/IP).
-- ----------------------------------------------------------------------------
create or replace function public.search_suggest(
  p_q     text,
  p_limit int default 8
)
returns table (
  ref_type text,
  ref_id   uuid,
  title    text
)
language sql stable
as $$
  select si.type as ref_type, si.ref_id, si.title
  from public.search_index si
  where si.title is not null
    and (si.title ilike unaccent(p_q) || '%' or si.title % p_q)
  order by similarity(si.title, p_q) desc, si.title asc
  limit least(greatest(p_limit, 1), 20);
$$;

-- ----------------------------------------------------------------------------
-- entity_completion_score — barème PRD 10.1 (miroir SQL du calcul applicatif
-- src/features/entities/completion.ts ; une seule vérité : le barème du PRD).
-- ----------------------------------------------------------------------------
create or replace function public.entity_completion_score(p_entity_id uuid)
returns int
language sql stable
as $$
  select
      case when coalesce(c.name, s.name, t.name) is not null and c.siret is not null then 10 else 0 end
    + case when e.insee_code is not null then 10 else 0 end
    + case when exists (select 1 from public.company_services cs where cs.entity_id = e.id) then 12 else 0 end
    + case when coalesce(array_length(c.segments, 1), 0) >= 1 then 6 else 0 end
    + case when coalesce(c.logo_url, s.logo_url, t.logo_url) is not null then 10 else 0 end
    + case when (select count(*) from public.media m
                 where m.owner_type = 'entity' and m.owner_id = e.id and m.kind = 'photo') >= 3 then 8 else 0 end
    + case when coalesce(c.website, s.website, t.website) is not null then 8 else 0 end
    + case when c.google_maps_url is not null then 6 else 0 end
    + case when c.google_business_url is not null then 6 else 0 end
    + case when coalesce(array_length(coalesce(c.service_areas, i.service_areas), 1), 0) >= 1 then 6 else 0 end
    + case when length(trim(coalesce(c.description, s.description, t.programs_text, ''))) >= 30 then 8 else 0 end
    + case when e.verified then 10 else 0 end
  from public.entities e
  left join public.companies c     on c.entity_id = e.id
  left join public.suppliers s     on s.entity_id = e.id
  left join public.training_orgs t on t.entity_id = e.id
  left join public.independents i  on i.entity_id = e.id
  where e.id = p_entity_id;
$$;

-- ----------------------------------------------------------------------------
-- rebuild_search_index — reconstruction complète depuis les tables sources
-- (PRD 19.5). SECURITY DEFINER : écrit dans search_index (service).
-- ----------------------------------------------------------------------------
create or replace function public.rebuild_search_index()
returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  delete from public.search_index;

  -- Entités actives (via la logique canonique reindex_entity)
  for r in select id from public.entities where status = 'active' and deleted_at is null loop
    perform public.reindex_entity(r.id);
  end loop;

  -- Profils publics
  insert into public.search_index(type, ref_id, title, content, geo_point, filters, tsv, updated_at)
  select 'profile', p.user_id,
         trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),
         coalesce(p.headline,'') || ' ' || coalesce(p.bio,''),
         case when p.lng is not null and p.lat is not null
              then st_setsrid(st_makepoint(p.lng, p.lat),4326)::geography end,
         jsonb_build_object('region', p.region),
         to_tsvector('french', unaccent(
           coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'') || ' ' ||
           coalesce(p.headline,'') || ' ' || coalesce(p.bio,''))),
         now()
  from public.profiles p
  where p.visibility = 'public' and p.deleted_at is null
  on conflict (type, ref_id) do nothing;

  -- Articles publiés (B3 : non soft-deletés)
  insert into public.search_index(type, ref_id, title, content, filters, tsv, updated_at)
  select 'article', a.id, a.title, coalesce(a.excerpt,''),
         jsonb_build_object('category', a.category_id),
         to_tsvector('french', unaccent(a.title || ' ' || coalesce(a.excerpt,''))),
         now()
  from public.articles a
  where a.status = 'published' and a.deleted_at is null
  on conflict (type, ref_id) do nothing;

  -- Offres publiées non expirées (T1 : géo incluse)
  insert into public.search_index(type, ref_id, title, content, geo_point, filters, tsv, updated_at)
  select 'job', j.id, j.title, coalesce(j.description,''),
         case when j.lng is not null and j.lat is not null
              then st_setsrid(st_makepoint(j.lng, j.lat),4326)::geography end,
         jsonb_build_object('contract_type', j.contract_type, 'region', j.region),
         to_tsvector('french', unaccent(j.title || ' ' || coalesce(j.description,''))),
         now()
  from public.jobs j
  where j.status = 'published' and j.deleted_at is null
    and (j.expires_at is null or j.expires_at > now())
  on conflict (type, ref_id) do nothing;
end;
$$;

-- Accès : lecture publique (annuaire, suggestions), score pour tous.
grant execute on function public.search_directory(entity_type, text, text, boolean, text, double precision, uuid, int) to anon, authenticated;
grant execute on function public.search_suggest(text, int) to anon, authenticated;
grant execute on function public.entity_completion_score(uuid) to anon, authenticated;
-- rebuild : service uniquement (pas de grant client).
