/**
 * Types de base de données — GÉNÉRÉS par scripts/gen-db-types.mjs.
 * Ne pas éditer à la main. Régénérer :
 *   DATABASE_URL=... node scripts/gen-db-types.mjs
 * (ou `pnpm db:types` une fois le projet Supabase lié.)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      article_categories: {
        Row: {
          id: string;
          label: string;
          slug: string;
        };
        Insert: {
          id?: string;
          label: string;
          slug: string;
        };
        Update: {
          id?: string;
          label?: string;
          slug?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          featured_image: string | null;
          category_id: string | null;
          status: Database['public']['Enums']['article_status'];
          parent_article_id: string | null;
          published_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          status?: Database['public']['Enums']['article_status'];
          parent_article_id?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          status?: Database['public']['Enums']['article_status'];
          parent_article_id?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      association_memberships: {
        Row: {
          id: string;
          user_id: string;
          status: Database['public']['Enums']['membership_status'];
          requested_at: string;
          decided_by: string | null;
          reason: string | null;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: Database['public']['Enums']['membership_status'];
          requested_at?: string;
          decided_by?: string | null;
          reason?: string | null;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: Database['public']['Enums']['membership_status'];
          requested_at?: string;
          decided_by?: string | null;
          reason?: string | null;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      author_applications: {
        Row: {
          id: string;
          user_id: string;
          expertise: string | null;
          motivation: string | null;
          status: string;
          reason: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          expertise?: string | null;
          motivation?: string | null;
          status?: string;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          expertise?: string | null;
          motivation?: string | null;
          status?: string;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      claim_requests: {
        Row: {
          id: string;
          entity_id: string;
          user_id: string;
          status: Database['public']['Enums']['claim_status'];
          proof: string | null;
          reason: string | null;
          decided_by: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          entity_id: string;
          user_id: string;
          status?: Database['public']['Enums']['claim_status'];
          proof?: string | null;
          reason?: string | null;
          decided_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          entity_id?: string;
          user_id?: string;
          status?: Database['public']['Enums']['claim_status'];
          proof?: string | null;
          reason?: string | null;
          decided_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          entity_id: string;
          name: string;
          legal_name: string | null;
          siret: string | null;
          legal_form: string | null;
          founded_year: number | null;
          headcount: string | null;
          director_name: string | null;
          website: string | null;
          linkedin: string | null;
          google_maps_url: string | null;
          google_business_url: string | null;
          address: string | null;
          service_areas: string[] | null;
          intervention_radius: number | null;
          segments: string[] | null;
          description: string | null;
          logo_url: string | null;
        };
        Insert: {
          entity_id: string;
          name: string;
          legal_name?: string | null;
          siret?: string | null;
          legal_form?: string | null;
          founded_year?: number | null;
          headcount?: string | null;
          director_name?: string | null;
          website?: string | null;
          linkedin?: string | null;
          google_maps_url?: string | null;
          google_business_url?: string | null;
          address?: string | null;
          service_areas?: string[] | null;
          intervention_radius?: number | null;
          segments?: string[] | null;
          description?: string | null;
          logo_url?: string | null;
        };
        Update: {
          entity_id?: string;
          name?: string;
          legal_name?: string | null;
          siret?: string | null;
          legal_form?: string | null;
          founded_year?: number | null;
          headcount?: string | null;
          director_name?: string | null;
          website?: string | null;
          linkedin?: string | null;
          google_maps_url?: string | null;
          google_business_url?: string | null;
          address?: string | null;
          service_areas?: string[] | null;
          intervention_radius?: number | null;
          segments?: string[] | null;
          description?: string | null;
          logo_url?: string | null;
        };
        Relationships: [];
      };
      company_services: {
        Row: {
          id: string;
          entity_id: string;
          service_type: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          service_type: string;
        };
        Update: {
          id?: string;
          entity_id?: string;
          service_type?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          role: Database['public']['Enums']['conv_member_role'];
          last_read_at: string | null;
          left_at: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          role?: Database['public']['Enums']['conv_member_role'];
          last_read_at?: string | null;
          left_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['conv_member_role'];
          last_read_at?: string | null;
          left_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: Database['public']['Enums']['conversation_type'];
          title: string | null;
          direct_key: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: Database['public']['Enums']['conversation_type'];
          title?: string | null;
          direct_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database['public']['Enums']['conversation_type'];
          title?: string | null;
          direct_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          id: string;
          user_id: string | null;
          template: string;
          to_email: string;
          status: Database['public']['Enums']['email_status'];
          provider_id: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          template: string;
          to_email: string;
          status?: Database['public']['Enums']['email_status'];
          provider_id?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          template?: string;
          to_email?: string;
          status?: Database['public']['Enums']['email_status'];
          provider_id?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entities: {
        Row: {
          id: string;
          type: Database['public']['Enums']['entity_type'];
          slug: string;
          status: Database['public']['Enums']['entity_status'];
          verified: boolean;
          source_consent: Database['public']['Enums']['source_consent'];
          city_name: string | null;
          insee_code: string | null;
          postal_code: string | null;
          department: string | null;
          region: string | null;
          lat: number | null;
          lng: number | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database['public']['Enums']['entity_type'];
          slug: string;
          status?: Database['public']['Enums']['entity_status'];
          verified?: boolean;
          source_consent?: Database['public']['Enums']['source_consent'];
          city_name?: string | null;
          insee_code?: string | null;
          postal_code?: string | null;
          department?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database['public']['Enums']['entity_type'];
          slug?: string;
          status?: Database['public']['Enums']['entity_status'];
          verified?: boolean;
          source_consent?: Database['public']['Enums']['source_consent'];
          city_name?: string | null;
          insee_code?: string | null;
          postal_code?: string | null;
          department?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_members: {
        Row: {
          id: string;
          entity_id: string;
          user_id: string;
          role: Database['public']['Enums']['member_role'];
          invited_by: string | null;
          invite_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          user_id: string;
          role?: Database['public']['Enums']['member_role'];
          invited_by?: string | null;
          invite_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['member_role'];
          invited_by?: string | null;
          invite_status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      entity_removal_requests: {
        Row: {
          id: string;
          entity_id: string;
          requester_email: string;
          requester_role: string | null;
          proof: string | null;
          status: Database['public']['Enums']['removal_status'];
          decided_by: string | null;
          reason: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          entity_id: string;
          requester_email: string;
          requester_role?: string | null;
          proof?: string | null;
          status?: Database['public']['Enums']['removal_status'];
          decided_by?: string | null;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          entity_id?: string;
          requester_email?: string;
          requester_role?: string | null;
          proof?: string | null;
          status?: Database['public']['Enums']['removal_status'];
          decided_by?: string | null;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      independents: {
        Row: {
          entity_id: string;
          user_id: string;
          headline: string | null;
          service_areas: string[] | null;
        };
        Insert: {
          entity_id: string;
          user_id: string;
          headline?: string | null;
          service_areas?: string[] | null;
        };
        Update: {
          entity_id?: string;
          user_id?: string;
          headline?: string | null;
          service_areas?: string[] | null;
        };
        Relationships: [];
      };
      job_alerts: {
        Row: {
          id: string;
          user_id: string;
          role_query: string | null;
          area: string | null;
          frequency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_query?: string | null;
          area?: string | null;
          frequency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_query?: string | null;
          area?: string | null;
          frequency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_profile_id: string;
          cv_url: string | null;
          message: string | null;
          status: Database['public']['Enums']['application_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_profile_id: string;
          cv_url?: string | null;
          message?: string | null;
          status?: Database['public']['Enums']['application_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_profile_id?: string;
          cv_url?: string | null;
          message?: string | null;
          status?: Database['public']['Enums']['application_status'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          entity_id: string;
          title: string;
          slug: string;
          contract_type: string | null;
          city_name: string | null;
          insee_code: string | null;
          region: string | null;
          lat: number | null;
          lng: number | null;
          description: string | null;
          skills: string[] | null;
          status: Database['public']['Enums']['job_status'];
          expires_at: string | null;
          published_at: string | null;
          closed_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_id: string;
          title: string;
          slug: string;
          contract_type?: string | null;
          city_name?: string | null;
          insee_code?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          description?: string | null;
          skills?: string[] | null;
          status?: Database['public']['Enums']['job_status'];
          expires_at?: string | null;
          published_at?: string | null;
          closed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_id?: string;
          title?: string;
          slug?: string;
          contract_type?: string | null;
          city_name?: string | null;
          insee_code?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          description?: string | null;
          skills?: string[] | null;
          status?: Database['public']['Enums']['job_status'];
          expires_at?: string | null;
          published_at?: string | null;
          closed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          owner_type: string;
          owner_id: string;
          url: string;
          kind: string | null;
          ord: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_type: string;
          owner_id: string;
          url: string;
          kind?: string | null;
          ord?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_type?: string;
          owner_id?: string;
          url?: string;
          kind?: string | null;
          ord?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      message_attachments: {
        Row: {
          id: string;
          message_id: string;
          url: string;
          kind: string | null;
          size_bytes: number | null;
        };
        Insert: {
          id?: string;
          message_id: string;
          url: string;
          kind?: string | null;
          size_bytes?: number | null;
        };
        Update: {
          id?: string;
          message_id?: string;
          url?: string;
          kind?: string | null;
          size_bytes?: number | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string | null;
          flagged: boolean;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body?: string | null;
          flagged?: boolean;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string | null;
          flagged?: boolean;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      mission_applications: {
        Row: {
          id: string;
          mission_id: string;
          applicant_user_id: string;
          status: Database['public']['Enums']['application_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          applicant_user_id: string;
          status?: Database['public']['Enums']['application_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          applicant_user_id?: string;
          status?: Database['public']['Enums']['application_status'];
          created_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          city_name: string | null;
          insee_code: string | null;
          region: string | null;
          status: Database['public']['Enums']['mission_status'];
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          city_name?: string | null;
          insee_code?: string | null;
          region?: string | null;
          status?: Database['public']['Enums']['mission_status'];
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          city_name?: string | null;
          insee_code?: string | null;
          region?: string | null;
          status?: Database['public']['Enums']['mission_status'];
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      moderation_decisions: {
        Row: {
          id: string;
          report_id: string | null;
          target_type: string;
          target_id: string;
          moderator_id: string;
          action: Database['public']['Enums']['mod_action'];
          scope: Database['public']['Enums']['mod_scope'];
          duration_hours: number | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id?: string | null;
          target_type: string;
          target_id: string;
          moderator_id: string;
          action: Database['public']['Enums']['mod_action'];
          scope?: Database['public']['Enums']['mod_scope'];
          duration_hours?: number | null;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string | null;
          target_type?: string;
          target_id?: string;
          moderator_id?: string;
          action?: Database['public']['Enums']['mod_action'];
          scope?: Database['public']['Enums']['mod_scope'];
          duration_hours?: number | null;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          type: string;
          channel: Database['public']['Enums']['notif_channel'];
          enabled: boolean;
        };
        Insert: {
          user_id: string;
          type: string;
          channel: Database['public']['Enums']['notif_channel'];
          enabled?: boolean;
        };
        Update: {
          user_id?: string;
          type?: string;
          channel?: Database['public']['Enums']['notif_channel'];
          enabled?: boolean;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          id: string;
          user_id: string;
          channel: Database['public']['Enums']['notif_channel'];
          type: string;
          payload: Json;
          status: Database['public']['Enums']['queue_status'];
          retry_count: number;
          scheduled_at: string;
          processed_at: string | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: Database['public']['Enums']['notif_channel'];
          type: string;
          payload?: Json;
          status?: Database['public']['Enums']['queue_status'];
          retry_count?: number;
          scheduled_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: Database['public']['Enums']['notif_channel'];
          type?: string;
          payload?: Json;
          status?: Database['public']['Enums']['queue_status'];
          retry_count?: number;
          scheduled_at?: string;
          processed_at?: string | null;
          error?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_skills: {
        Row: {
          profile_id: string;
          skill_id: string;
        };
        Insert: {
          profile_id: string;
          skill_id: string;
        };
        Update: {
          profile_id?: string;
          skill_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          slug: string;
          phone: string | null;
          headline: string | null;
          bio: string | null;
          photo_url: string | null;
          visibility: Database['public']['Enums']['visibility_level'];
          city_name: string | null;
          insee_code: string | null;
          postal_code: string | null;
          department: string | null;
          region: string | null;
          lat: number | null;
          lng: number | null;
          main_role: string;
          current_entity_id: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          slug: string;
          phone?: string | null;
          headline?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          visibility?: Database['public']['Enums']['visibility_level'];
          city_name?: string | null;
          insee_code?: string | null;
          postal_code?: string | null;
          department?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          main_role?: string;
          current_entity_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          slug?: string;
          phone?: string | null;
          headline?: string | null;
          bio?: string | null;
          photo_url?: string | null;
          visibility?: Database['public']['Enums']['visibility_level'];
          city_name?: string | null;
          insee_code?: string | null;
          postal_code?: string | null;
          department?: string | null;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          main_role?: string;
          current_entity_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          window_start: string;
          count: number;
        };
        Insert: {
          key: string;
          window_start: string;
          count?: number;
        };
        Update: {
          key?: string;
          window_start?: string;
          count?: number;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          quality: string | null;
          text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          quality?: string | null;
          text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          quality?: string | null;
          text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string | null;
          status: Database['public']['Enums']['report_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason?: string | null;
          status?: Database['public']['Enums']['report_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: string;
          target_id?: string;
          reason?: string | null;
          status?: Database['public']['Enums']['report_status'];
          created_at?: string;
        };
        Relationships: [];
      };
      resource_downloads: {
        Row: {
          id: string;
          resource_id: string;
          user_id: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          user_id?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          resource_id?: string;
          user_id?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          file_url: string;
          kind: string | null;
          cover_image: string | null;
          audience: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          file_url: string;
          kind?: string | null;
          cover_image?: string | null;
          audience?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          file_url?: string;
          kind?: string | null;
          cover_image?: string | null;
          audience?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      search_index: {
        Row: {
          id: string;
          type: string;
          ref_id: string;
          title: string | null;
          content: string | null;
          geo_point: unknown | null;
          filters: Json | null;
          tsv: unknown | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          ref_id: string;
          title?: string | null;
          content?: string | null;
          geo_point?: unknown | null;
          filters?: Json | null;
          tsv?: unknown | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          ref_id?: string;
          title?: string | null;
          content?: string | null;
          geo_point?: unknown | null;
          filters?: Json | null;
          tsv?: unknown | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      seo_metadata: {
        Row: {
          id: string;
          page_type: string;
          ref_id: string | null;
          title: string | null;
          description: string | null;
          og_image: string | null;
          schema_type: string | null;
        };
        Insert: {
          id?: string;
          page_type: string;
          ref_id?: string | null;
          title?: string | null;
          description?: string | null;
          og_image?: string | null;
          schema_type?: string | null;
        };
        Update: {
          id?: string;
          page_type?: string;
          ref_id?: string | null;
          title?: string | null;
          description?: string | null;
          og_image?: string | null;
          schema_type?: string | null;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          label: string;
          family: string | null;
        };
        Insert: {
          id?: string;
          label: string;
          family?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          family?: string | null;
        };
        Relationships: [];
      };
      slug_history: {
        Row: {
          old_slug: string;
          entity_type: string;
          ref_id: string;
          redirect_to_slug: string;
          created_at: string;
        };
        Insert: {
          old_slug: string;
          entity_type: string;
          ref_id: string;
          redirect_to_slug: string;
          created_at?: string;
        };
        Update: {
          old_slug?: string;
          entity_type?: string;
          ref_id?: string;
          redirect_to_slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          entity_id: string;
          name: string;
          family: string;
          sub_category: string;
          website: string | null;
          description: string | null;
          logo_url: string | null;
        };
        Insert: {
          entity_id: string;
          name: string;
          family: string;
          sub_category: string;
          website?: string | null;
          description?: string | null;
          logo_url?: string | null;
        };
        Update: {
          entity_id?: string;
          name?: string;
          family?: string;
          sub_category?: string;
          website?: string | null;
          description?: string | null;
          logo_url?: string | null;
        };
        Relationships: [];
      };
      training_orgs: {
        Row: {
          entity_id: string;
          name: string;
          certifications: string[] | null;
          website: string | null;
          logo_url: string | null;
          programs_text: string | null;
        };
        Insert: {
          entity_id: string;
          name: string;
          certifications?: string[] | null;
          website?: string | null;
          logo_url?: string | null;
          programs_text?: string | null;
        };
        Update: {
          entity_id?: string;
          name?: string;
          certifications?: string[] | null;
          website?: string | null;
          logo_url?: string | null;
          programs_text?: string | null;
        };
        Relationships: [];
      };
      user_capabilities: {
        Row: {
          user_id: string;
          capability: string;
          source: string;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: {
          user_id: string;
          capability: string;
          source: string;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          user_id?: string;
          capability?: string;
          source?: string;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          id: string;
          entity_id: string;
          status: Database['public']['Enums']['verif_status'];
          seniority: string | null;
          headcount: string | null;
          requested_slots: Json | null;
          decided_by: string | null;
          reason: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          entity_id: string;
          status?: Database['public']['Enums']['verif_status'];
          seniority?: string | null;
          headcount?: string | null;
          requested_slots?: Json | null;
          decided_by?: string | null;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          entity_id?: string;
          status?: Database['public']['Enums']['verif_status'];
          seniority?: string | null;
          headcount?: string | null;
          requested_slots?: Json | null;
          decided_by?: string | null;
          reason?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      entity_has_members: {
        Args: { p_entity_id: string };
        Returns: boolean;
      };
      has_capability: {
        Args: { cap: string };
        Returns: boolean;
      };
      is_blocked: {
        Args: { p_blocker_id: string; p_blocked_id: string };
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_entity_member: {
        Args: { p_entity_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_entity_owner: {
        Args: { p_entity_id: string; p_user_id: string };
        Returns: boolean;
      };
      recalc_entity_capabilities: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      application_status: 'submitted' | 'viewed' | 'interview' | 'hired' | 'rejected' | 'withdrawn';
      article_status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
      claim_status: 'pending' | 'approved' | 'rejected';
      conv_member_role: 'group_admin' | 'member';
      conversation_type: 'direct' | 'group';
      email_status: 'sent' | 'delivered' | 'bounced' | 'failed';
      entity_status: 'active' | 'suspended' | 'archived';
      entity_type: 'company' | 'supplier' | 'training_org' | 'independent';
      job_status: 'draft' | 'published' | 'closed' | 'archived';
      member_role: 'owner' | 'manager' | 'editor';
      membership_status: 'pending' | 'approved' | 'rejected' | 'revoked';
      mission_status: 'draft' | 'published' | 'closed' | 'archived';
      mod_action: 'dismiss' | 'hide' | 'warn' | 'suspend' | 'ban' | 'delete';
      mod_scope: 'content' | 'user';
      notif_channel: 'in_app' | 'email' | 'push';
      queue_status: 'pending' | 'processing' | 'delivered' | 'failed';
      removal_status: 'open' | 'approved' | 'rejected';
      report_status: 'open' | 'dismissed' | 'actioned';
      source_consent: 'claimed' | 'self' | 'seed_unconsented';
      verif_status: 'draft' | 'pending' | 'approved' | 'rejected';
      visibility_level: 'public' | 'members' | 'connections' | 'private';
    };
    CompositeTypes: Record<string, never>;
  };
};

// Helpers de commodité (mêmes noms que le générateur officiel)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
