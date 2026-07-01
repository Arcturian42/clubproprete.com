-- ============================================================================
-- ClubProprete.com — RLS POLICIES (Phase 0) — PRD v9.0
-- Autorisation 100% par capacités. Aucun claim 'role'.
-- Toutes les policies utilisent les helpers SECURITY DEFINER (has_capability,
-- is_entity_member, is_entity_owner, is_conversation_participant, is_blocked)
-- pour éviter la récursion RLS. Opérateur ? proscrit.
-- ============================================================================

-- Activation RLS sur les 46 tables
alter table public.profiles                enable row level security;
alter table public.user_capabilities       enable row level security;
alter table public.skills                  enable row level security;
alter table public.profile_skills          enable row level security;
alter table public.entities                enable row level security;
alter table public.companies               enable row level security;
alter table public.suppliers               enable row level security;
alter table public.training_orgs           enable row level security;
alter table public.independents            enable row level security;
alter table public.company_services        enable row level security;
alter table public.entity_members          enable row level security;
alter table public.verification_requests   enable row level security;
alter table public.claim_requests          enable row level security;
alter table public.entity_removal_requests enable row level security;
alter table public.article_categories      enable row level security;
alter table public.articles                enable row level security;
alter table public.author_applications     enable row level security;
alter table public.jobs                    enable row level security;
alter table public.job_applications        enable row level security;
alter table public.job_alerts              enable row level security;
alter table public.association_memberships enable row level security;
alter table public.missions                enable row level security;
alter table public.mission_applications    enable row level security;
alter table public.connections             enable row level security;
alter table public.follows                 enable row level security;
alter table public.recommendations         enable row level security;
alter table public.conversations           enable row level security;
alter table public.conversation_members    enable row level security;
alter table public.messages                enable row level security;
alter table public.message_attachments     enable row level security;
alter table public.blocks                  enable row level security;
alter table public.notifications           enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reports                 enable row level security;
alter table public.moderation_decisions    enable row level security;
alter table public.media                   enable row level security;
alter table public.audit_logs              enable row level security;
alter table public.resources               enable row level security;
alter table public.resource_downloads      enable row level security;
alter table public.search_index            enable row level security;
alter table public.seo_metadata            enable row level security;
alter table public.slug_history            enable row level security;
alter table public.email_deliveries        enable row level security;
alter table public.notification_queue      enable row level security;
alter table public.rate_limits             enable row level security;
alter table public.user_sessions           enable row level security;

-- ---------- profiles ----------
create policy profiles_read on public.profiles for select
  using ( (visibility = 'public' and deleted_at is null)
          or auth.uid() = user_id
          or public.has_capability('moderate') );
create policy profiles_update on public.profiles for update
  using ( auth.uid() = user_id or public.has_capability('moderate') )
  with check ( auth.uid() = user_id or public.has_capability('moderate') );
-- INSERT via trigger handle_new_user (service) ; pas de policy insert publique.

-- ---------- user_capabilities ----------
create policy usercap_read on public.user_capabilities for select
  using ( auth.uid() = user_id or public.has_capability('admin_panel') );
create policy usercap_write on public.user_capabilities for all
  using ( public.has_capability('admin_panel') )
  with check ( public.has_capability('admin_panel') );

-- ---------- skills / profile_skills ----------
create policy skills_read on public.skills for select using ( true );
create policy skills_admin on public.skills for all
  using ( public.has_capability('admin_panel') ) with check ( public.has_capability('admin_panel') );
create policy pskills_read on public.profile_skills for select using ( true );
create policy pskills_write on public.profile_skills for all
  using ( auth.uid() = profile_id ) with check ( auth.uid() = profile_id );

-- ---------- entities ----------
create policy entities_read on public.entities for select
  using ( (status = 'active' and deleted_at is null)
          or public.is_entity_member(id, auth.uid())
          or public.has_capability('moderate') );
create policy entities_insert on public.entities for insert
  with check ( auth.uid() is not null );                          -- 1A : tout authentifié peut créer une entité
create policy entities_update on public.entities for update
  using ( public.is_entity_member(id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(id, auth.uid()) or public.has_capability('moderate') );
create policy entities_delete on public.entities for delete
  using ( public.is_entity_member(id, auth.uid()) or public.has_capability('moderate') );

-- ---------- companies / suppliers / training_orgs / independents (via entities) ----------
create policy companies_read on public.companies for select
  using ( exists (select 1 from public.entities e where e.id = entity_id
                  and ((e.status='active' and e.deleted_at is null)
                       or public.is_entity_member(e.id, auth.uid())
                       or public.has_capability('moderate'))) );
create policy companies_write on public.companies for all
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

create policy suppliers_read on public.suppliers for select
  using ( exists (select 1 from public.entities e where e.id = entity_id
                  and ((e.status='active' and e.deleted_at is null)
                       or public.is_entity_member(e.id, auth.uid())
                       or public.has_capability('moderate'))) );
create policy suppliers_write on public.suppliers for all
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

create policy training_read on public.training_orgs for select
  using ( exists (select 1 from public.entities e where e.id = entity_id
                  and ((e.status='active' and e.deleted_at is null)
                       or public.is_entity_member(e.id, auth.uid())
                       or public.has_capability('moderate'))) );
create policy training_write on public.training_orgs for all
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

create policy independents_read on public.independents for select
  using ( exists (select 1 from public.entities e where e.id = entity_id
                  and ((e.status='active' and e.deleted_at is null)
                       or public.is_entity_member(e.id, auth.uid())
                       or public.has_capability('moderate'))) );
create policy independents_write on public.independents for all
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

-- ---------- company_services ----------
create policy cservices_read on public.company_services for select
  using ( exists (select 1 from public.entities e where e.id = entity_id
                  and e.status='active' and e.deleted_at is null) );
create policy cservices_write on public.company_services for all
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

-- ---------- entity_members ----------
create policy emembers_read on public.entity_members for select
  using ( auth.uid() = user_id
          or public.is_entity_member(entity_id, auth.uid())
          or public.has_capability('moderate') );
create policy emembers_insert on public.entity_members for insert
  with check (
    public.is_entity_owner(entity_id, auth.uid())
    or ( auth.uid() = user_id and role = 'owner'                  -- 1B : premier owner sur une entité sans membre
         and not public.entity_has_members(entity_members.entity_id) )   -- helper SECURITY DEFINER (sinon RLS masque les membres existants)
    or public.has_capability('moderate') );
-- 2A : un membre peut mettre à jour SA ligne (accepter l'invitation, se retirer) mais
-- la modification du champ role est réservée owner/moderate — garantie par le trigger guard_member_role.
create policy emembers_update on public.entity_members for update
  using ( public.is_entity_owner(entity_id, auth.uid()) or auth.uid() = user_id or public.has_capability('moderate') )
  with check ( public.is_entity_owner(entity_id, auth.uid()) or auth.uid() = user_id or public.has_capability('moderate') );
create policy emembers_delete on public.entity_members for delete
  using ( public.is_entity_owner(entity_id, auth.uid()) or public.has_capability('moderate') );

-- ---------- verification_requests ----------
create policy verif_read on public.verification_requests for select
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );
create policy verif_insert on public.verification_requests for insert
  with check ( public.is_entity_member(entity_id, auth.uid()) );
create policy verif_update on public.verification_requests for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- claim_requests ----------
create policy claim_read on public.claim_requests for select
  using ( auth.uid() = user_id or public.has_capability('moderate') );
create policy claim_insert on public.claim_requests for insert
  with check ( auth.uid() = user_id );
create policy claim_update on public.claim_requests for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- entity_removal_requests ----------
create policy removal_read on public.entity_removal_requests for select
  using ( public.has_capability('moderate') );
create policy removal_insert on public.entity_removal_requests for insert
  with check ( true );  -- demande publique (anti-bot applicatif + rate limit)
create policy removal_update on public.entity_removal_requests for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- article_categories ----------
create policy artcat_read on public.article_categories for select using ( true );
create policy artcat_admin on public.article_categories for all
  using ( public.has_capability('admin_panel') ) with check ( public.has_capability('admin_panel') );

-- ---------- articles ----------
create policy articles_read on public.articles for select
  using ( (status = 'published' and deleted_at is null)          -- B : ne pas exposer un article soft-deleté
          or auth.uid() = author_id
          or public.has_capability('moderate') );
create policy articles_insert on public.articles for insert
  with check ( auth.uid() = author_id and public.has_capability('write_article') );
-- L'auteur cible ses propres articles (USING) ; le WITH CHECK borne l'état
-- résultant : édition de contenu autorisée hors 'published' (draft/rejected/
-- pending), et archivage/soft-delete depuis n'importe quel état. Un article
-- publié NE PEUT PAS être édité en restant publié (révision = article enfant,
-- F-17). Le durcissement fin des transitions (ex. published→draft) relèvera
-- d'un trigger guard_article_transition en MVP 2.
create policy articles_update on public.articles for update
  using ( auth.uid() = author_id or public.has_capability('moderate') )
  with check (
    public.has_capability('moderate')
    or ( auth.uid() = author_id
         and ( status in ('draft','rejected','pending','archived')
               or deleted_at is not null ) ) );
create policy articles_delete on public.articles for delete
  using ( (auth.uid() = author_id and status = 'draft') or public.has_capability('moderate') );

-- ---------- author_applications ----------
create policy authapp_read on public.author_applications for select
  using ( auth.uid() = user_id or public.has_capability('moderate') );
create policy authapp_insert on public.author_applications for insert
  with check ( auth.uid() = user_id );
create policy authapp_update on public.author_applications for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- jobs ----------
create policy jobs_read on public.jobs for select
  using ( (status = 'published' and deleted_at is null)          -- B
          or public.is_entity_member(entity_id, auth.uid())
          or public.has_capability('moderate') );
create policy jobs_insert on public.jobs for insert
  with check ( public.has_capability('publish_job') and public.is_entity_member(entity_id, auth.uid()) );
create policy jobs_update on public.jobs for update
  using ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') )
  with check ( public.is_entity_member(entity_id, auth.uid()) or public.has_capability('moderate') );

-- ---------- job_applications ----------
create policy japp_read on public.job_applications for select
  using ( auth.uid() = candidate_profile_id
          or exists (select 1 from public.jobs j where j.id = job_id and public.is_entity_member(j.entity_id, auth.uid()))
          or public.has_capability('moderate') );
create policy japp_insert on public.job_applications for insert
  with check ( auth.uid() = candidate_profile_id );
create policy japp_update on public.job_applications for update
  using ( auth.uid() = candidate_profile_id
          or exists (select 1 from public.jobs j where j.id = job_id and public.is_entity_member(j.entity_id, auth.uid())) )
  with check ( auth.uid() = candidate_profile_id
          or exists (select 1 from public.jobs j where j.id = job_id and public.is_entity_member(j.entity_id, auth.uid())) );

-- ---------- job_alerts ----------
create policy jalerts_all on public.job_alerts for all
  using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- ---------- association_memberships ----------
create policy assoc_read on public.association_memberships for select
  using ( auth.uid() = user_id or public.has_capability('moderate') );
create policy assoc_insert on public.association_memberships for insert
  with check ( auth.uid() = user_id );
create policy assoc_update on public.association_memberships for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- missions ----------
create policy missions_read on public.missions for select
  using ( (public.has_capability('access_subcontracting') and deleted_at is null)   -- B
          or auth.uid() = creator_id
          or public.has_capability('moderate') );
create policy missions_insert on public.missions for insert
  with check ( public.has_capability('publish_mission') and auth.uid() = creator_id );
create policy missions_update on public.missions for update
  using ( auth.uid() = creator_id or public.has_capability('moderate') )
  with check ( auth.uid() = creator_id or public.has_capability('moderate') );

-- ---------- mission_applications ----------
create policy mapp_read on public.mission_applications for select
  using ( auth.uid() = applicant_user_id
          or exists (select 1 from public.missions m where m.id = mission_id and m.creator_id = auth.uid())
          or public.has_capability('moderate') );
create policy mapp_insert on public.mission_applications for insert
  with check ( auth.uid() = applicant_user_id and public.has_capability('access_subcontracting') );
-- 2C : le recruteur (créateur) gère le statut ; le candidat ne peut que se désister (withdrawn).
create policy mapp_update_recruiter on public.mission_applications for update
  using ( exists (select 1 from public.missions m where m.id = mission_id and m.creator_id = auth.uid()) )
  with check ( exists (select 1 from public.missions m where m.id = mission_id and m.creator_id = auth.uid()) );
create policy mapp_update_candidate on public.mission_applications for update
  using ( auth.uid() = applicant_user_id )
  with check ( auth.uid() = applicant_user_id and status = 'withdrawn' );

-- ---------- connections ----------
create policy conn_read on public.connections for select
  using ( auth.uid() = from_user_id or auth.uid() = to_user_id
          or exists (select 1 from public.profiles p where p.user_id = to_user_id and p.visibility='public') );
create policy conn_insert on public.connections for insert
  with check ( auth.uid() = from_user_id and not public.is_blocked(to_user_id, auth.uid()) );
-- 2B : seul le destinataire accepte. USING inclut les deux participants pour que
-- la ligne soit VISIBLE à l'émetteur (sinon un UPDATE hors périmètre touche 0
-- ligne sans erreur) ; le WITH CHECK restreint la nouvelle valeur au destinataire,
-- donc une auto-acceptation par l'émetteur VIOLE le check et lève une erreur.
create policy conn_update on public.connections for update
  using ( auth.uid() = from_user_id or auth.uid() = to_user_id )
  with check ( auth.uid() = to_user_id );
create policy conn_delete on public.connections for delete
  using ( auth.uid() = from_user_id or auth.uid() = to_user_id );

-- ---------- follows ----------
create policy follows_read on public.follows for select
  using ( auth.uid() = from_user_id or auth.uid() = to_user_id
          or exists (select 1 from public.profiles p where p.user_id = to_user_id and p.visibility='public') );
create policy follows_write on public.follows for all
  using ( auth.uid() = from_user_id )
  with check ( auth.uid() = from_user_id and not public.is_blocked(to_user_id, auth.uid()) );

-- ---------- recommendations ----------
create policy reco_read on public.recommendations for select
  using ( exists (select 1 from public.profiles p where p.user_id = to_user_id and p.visibility='public')
          or auth.uid() = from_user_id or auth.uid() = to_user_id
          or public.has_capability('moderate') );
create policy reco_insert on public.recommendations for insert
  with check ( auth.uid() = from_user_id and not public.is_blocked(to_user_id, auth.uid()) );
create policy reco_modify on public.recommendations for update
  using ( auth.uid() = from_user_id or public.has_capability('moderate') )
  with check ( auth.uid() = from_user_id or public.has_capability('moderate') );
create policy reco_delete on public.recommendations for delete
  using ( auth.uid() = from_user_id or public.has_capability('moderate') );

-- ---------- conversations ----------
create policy conv_read on public.conversations for select
  using ( public.is_conversation_participant(id, auth.uid()) );
create policy conv_insert on public.conversations for insert
  with check ( auth.uid() = created_by );
create policy conv_update on public.conversations for update
  using ( public.is_conversation_participant(id, auth.uid()) )
  with check ( public.is_conversation_participant(id, auth.uid()) );

-- ---------- conversation_members ----------
create policy cmembers_read on public.conversation_members for select
  using ( public.is_conversation_participant(conversation_id, auth.uid()) );
create policy cmembers_insert on public.conversation_members for insert
  with check ( public.is_conversation_participant(conversation_id, auth.uid())
               or auth.uid() = user_id );
create policy cmembers_update on public.conversation_members for update
  using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- ---------- messages ----------
create policy messages_read on public.messages for select
  using ( ( public.is_conversation_participant(conversation_id, auth.uid())
            and not public.is_blocked(sender_id, auth.uid())
            and deleted_at is null )                              -- B : message soft-deleté masqué au participant
          or ( public.has_capability('moderate') and flagged = true ) );
create policy messages_insert on public.messages for insert
  with check ( auth.uid() = sender_id
               and public.is_conversation_participant(conversation_id, auth.uid())
               and not exists (
                 select 1 from public.conversation_members cm
                 join public.blocks b on b.blocker_id = cm.user_id and b.blocked_id = auth.uid()
                 where cm.conversation_id = messages.conversation_id ) );
create policy messages_update on public.messages for update
  using ( auth.uid() = sender_id or public.has_capability('moderate') )       -- B4 : modérateur peut flagger
  with check ( auth.uid() = sender_id or public.has_capability('moderate') );

-- ---------- message_attachments ----------
create policy attach_read on public.message_attachments for select
  using ( exists (select 1 from public.messages m
                  where m.id = message_id
                  and public.is_conversation_participant(m.conversation_id, auth.uid())) );
create policy attach_insert on public.message_attachments for insert
  with check ( exists (select 1 from public.messages m
                       where m.id = message_id and m.sender_id = auth.uid()) );
create policy attach_delete on public.message_attachments for delete
  using ( exists (select 1 from public.messages m
                  where m.id = message_id and m.sender_id = auth.uid()) );

-- ---------- blocks ----------
create policy blocks_read on public.blocks for select using ( auth.uid() = blocker_id );
create policy blocks_write on public.blocks for all
  using ( auth.uid() = blocker_id ) with check ( auth.uid() = blocker_id );

-- ---------- notifications ----------
create policy notif_read on public.notifications for select using ( auth.uid() = user_id );
create policy notif_update on public.notifications for update
  using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );
-- INSERT par service role (Edge Function) ; pas de policy insert client.

-- ---------- notification_preferences ----------
create policy notifpref_all on public.notification_preferences for all
  using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- ---------- reports ----------
create policy reports_read on public.reports for select
  using ( auth.uid() = reporter_id or public.has_capability('moderate') );
create policy reports_insert on public.reports for insert
  with check ( auth.uid() = reporter_id );
create policy reports_update on public.reports for update
  using ( public.has_capability('moderate') ) with check ( public.has_capability('moderate') );

-- ---------- moderation_decisions ----------
create policy moddec_read on public.moderation_decisions for select
  using ( public.has_capability('moderate') );
create policy moddec_insert on public.moderation_decisions for insert
  with check ( public.has_capability('moderate') );
-- pas d'UPDATE/DELETE : table immuable.

-- ---------- media ----------
create policy media_read on public.media for select
  using ( true );  -- lecture publique (les URLs pointent vers Storage à policies propres)
create policy media_write on public.media for all
  using (
    public.has_capability('moderate')
    or ( owner_type = 'profile' and owner_id = auth.uid() )
    or ( owner_type = 'entity'  and public.is_entity_member(owner_id, auth.uid()) )   -- point 2 : upload logo/photo d'entité par un membre
    or ( owner_type = 'article' and exists (
           select 1 from public.articles a where a.id = owner_id and a.author_id = auth.uid()) ) )
  with check (
    public.has_capability('moderate')
    or ( owner_type = 'profile' and owner_id = auth.uid() )
    or ( owner_type = 'entity'  and public.is_entity_member(owner_id, auth.uid()) )
    or ( owner_type = 'article' and exists (
           select 1 from public.articles a where a.id = owner_id and a.author_id = auth.uid()) ) );

-- ---------- audit_logs ----------
create policy audit_read on public.audit_logs for select
  using ( public.has_capability('admin_panel') );
-- INSERT par service role ; immuable.

-- ---------- resources ----------
create policy resources_read on public.resources for select
  using ( status = 'published' or public.has_capability('admin_panel') );
create policy resources_admin on public.resources for all
  using ( public.has_capability('admin_panel') ) with check ( public.has_capability('admin_panel') );

-- ---------- resource_downloads ----------
create policy rdl_insert on public.resource_downloads for insert with check ( true );
create policy rdl_read on public.resource_downloads for select
  using ( public.has_capability('admin_panel') or auth.uid() = user_id );

-- ---------- search_index / seo_metadata ----------
create policy search_read on public.search_index for select using ( true );
-- écriture par triggers (security definer) ; pas de policy write client.
create policy seo_read on public.seo_metadata for select using ( true );
create policy seo_admin on public.seo_metadata for all
  using ( public.has_capability('admin_panel') ) with check ( public.has_capability('admin_panel') );

-- ---------- slug_history (résolution 301 côté serveur) ----------
-- service role uniquement : aucune policy permissive (RLS active = deny par défaut).

-- ---------- email_deliveries / notification_queue / rate_limits ----------
-- service role uniquement : RLS active, aucune policy = deny total côté client.

-- ---------- user_sessions ----------
create policy usess_read on public.user_sessions for select
  using ( auth.uid() = user_id or public.has_capability('admin_panel') );
-- écriture par service role.
