export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          action: string
          created_at: string
          expires_at: string
          input: Json
          key: string
          model: string | null
          output: Json
        }
        Insert: {
          action: string
          created_at?: string
          expires_at?: string
          input?: Json
          key: string
          model?: string | null
          output?: Json
        }
        Update: {
          action?: string
          created_at?: string
          expires_at?: string
          input?: Json
          key?: string
          model?: string | null
          output?: Json
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          session_type: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          session_type: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          session_type?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context_memory: {
        Row: {
          data: Json
          id: string
          last_score: number | null
          last_stage: string | null
          role: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          id?: string
          last_score?: number | null
          last_stage?: string | null
          role?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          id?: string
          last_score?: number | null
          last_stage?: string | null
          role?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          is_pinned: boolean
          is_shared: boolean
          module_type: string
          share_slug: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_pinned?: boolean
          is_shared?: boolean
          module_type: string
          share_slug?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_pinned?: boolean
          is_shared?: boolean
          module_type?: string
          share_slug?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          id: string
          match_weights: Json
          modules_enabled: Json
          singleton: boolean
          updated_at: string
          updated_by: string | null
          validation_weights: Json
        }
        Insert: {
          id?: string
          match_weights?: Json
          modules_enabled?: Json
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
          validation_weights?: Json
        }
        Update: {
          id?: string
          match_weights?: Json
          modules_enabled?: Json
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
          validation_weights?: Json
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          cache_hit: boolean
          created_at: string
          id: string
          latency_ms: number
          metadata: Json
          module: string
          tokens_in: number
          tokens_out: number
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          id?: string
          latency_ms?: number
          metadata?: Json
          module: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          id?: string
          latency_ms?: number
          metadata?: Json
          module?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          recipients_count: number
          sender_id: string
          target_roles: string[]
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipients_count?: number
          sender_id: string
          target_roles?: string[]
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipients_count?: number
          sender_id?: string
          target_roles?: string[]
          title?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_type: string
          created_at: string | null
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          connection_type?: string
          created_at?: string | null
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          resolved_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_alerts: {
        Row: {
          alert_type: string
          created_at: string
          fire_at: string
          hackathon_id: string
          id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          fire_at: string
          hackathon_id: string
          id?: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          fire_at?: string
          hackathon_id?: string
          id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_alerts_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_ingestion_runs: {
        Row: {
          duration_ms: number | null
          error: string | null
          error_details: Json | null
          finished_at: string | null
          id: string
          inserted_count: number | null
          records_seen: number | null
          skipped_count: number | null
          source_slug: string
          started_at: string
          status: string
          updated_count: number | null
        }
        Insert: {
          duration_ms?: number | null
          error?: string | null
          error_details?: Json | null
          finished_at?: string | null
          id?: string
          inserted_count?: number | null
          records_seen?: number | null
          skipped_count?: number | null
          source_slug: string
          started_at?: string
          status?: string
          updated_count?: number | null
        }
        Update: {
          duration_ms?: number | null
          error?: string | null
          error_details?: Json | null
          finished_at?: string | null
          id?: string
          inserted_count?: number | null
          records_seen?: number | null
          skipped_count?: number | null
          source_slug?: string
          started_at?: string
          status?: string
          updated_count?: number | null
        }
        Relationships: []
      }
      hackathon_registrations: {
        Row: {
          created_at: string | null
          hackathon_id: string
          id: string
          status: string | null
          team_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hackathon_id: string
          id?: string
          status?: string | null
          team_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hackathon_id?: string
          id?: string
          status?: string | null
          team_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_registrations_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_saves: {
        Row: {
          created_at: string
          hackathon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_saves_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_sources: {
        Row: {
          base_url: string | null
          config: Json
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_status: string | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_status?: string | null
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_status?: string | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      hackathon_team_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_team_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_team_invites: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          message: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          message?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          message?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_team_members: {
        Row: {
          joined_at: string
          role: string | null
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: string | null
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string | null
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hackathon_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_teammate_posts: {
        Row: {
          availability: string | null
          created_at: string
          hackathon_id: string
          headline: string
          id: string
          looking_for_skills: string[] | null
          message: string | null
          role_preference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          hackathon_id: string
          headline: string
          id?: string
          looking_for_skills?: string[] | null
          message?: string | null
          role_preference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          hackathon_id?: string
          headline?: string
          id?: string
          looking_for_skills?: string[] | null
          message?: string | null
          role_preference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_teammate_posts_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_teams: {
        Row: {
          created_at: string
          hackathon_id: string
          id: string
          is_open: boolean | null
          looking_for: string[] | null
          max_size: number | null
          name: string
          owner_id: string
          pitch: string | null
          required_skills: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          id?: string
          is_open?: boolean | null
          looking_for?: string[] | null
          max_size?: number | null
          name: string
          owner_id: string
          pitch?: string | null
          required_skills?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          id?: string
          is_open?: boolean | null
          looking_for?: string[] | null
          max_size?: number | null
          name?: string
          owner_id?: string
          pitch?: string | null
          required_skills?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_teams_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_watchlist_items: {
        Row: {
          created_at: string
          hackathon_id: string
          watchlist_id: string
        }
        Insert: {
          created_at?: string
          hackathon_id: string
          watchlist_id: string
        }
        Update: {
          created_at?: string
          hackathon_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hackathon_watchlist_items_hackathon_id_fkey"
            columns: ["hackathon_id"]
            isOneToOne: false
            referencedRelation: "hackathons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathon_watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "hackathon_watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      hackathon_watchlists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      hackathons: {
        Row: {
          ai_classified_at: string | null
          allows_solo: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          dedupe_hash: string | null
          description: string
          difficulty: string | null
          eligibility: string[] | null
          end_date: string
          external_id: string | null
          external_url: string | null
          first_seen_at: string | null
          id: string
          image_url: string | null
          is_beginner_friendly: boolean | null
          is_student_only: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          location: string | null
          max_participants: number | null
          mode: string
          organizer: string
          popularity_score: number | null
          prize: string | null
          prize_pool_inr: number | null
          prize_pool_text: string | null
          raw: Json | null
          registration_deadline: string | null
          registration_url: string | null
          saves_count: number | null
          search_tsv: unknown
          searchable_text: string | null
          source_slug: string
          start_date: string
          status: string
          tags: string[] | null
          team_size_max: number | null
          team_size_min: number | null
          themes: string[]
          title: string
          updated_at: string | null
          verified_by: string | null
          views_count: number | null
          website_url: string | null
        }
        Insert: {
          ai_classified_at?: string | null
          allows_solo?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          description: string
          difficulty?: string | null
          eligibility?: string[] | null
          end_date: string
          external_id?: string | null
          external_url?: string | null
          first_seen_at?: string | null
          id?: string
          image_url?: string | null
          is_beginner_friendly?: boolean | null
          is_student_only?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          max_participants?: number | null
          mode?: string
          organizer: string
          popularity_score?: number | null
          prize?: string | null
          prize_pool_inr?: number | null
          prize_pool_text?: string | null
          raw?: Json | null
          registration_deadline?: string | null
          registration_url?: string | null
          saves_count?: number | null
          search_tsv?: unknown
          searchable_text?: string | null
          source_slug?: string
          start_date: string
          status?: string
          tags?: string[] | null
          team_size_max?: number | null
          team_size_min?: number | null
          themes?: string[]
          title: string
          updated_at?: string | null
          verified_by?: string | null
          views_count?: number | null
          website_url?: string | null
        }
        Update: {
          ai_classified_at?: string | null
          allows_solo?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          dedupe_hash?: string | null
          description?: string
          difficulty?: string | null
          eligibility?: string[] | null
          end_date?: string
          external_id?: string | null
          external_url?: string | null
          first_seen_at?: string | null
          id?: string
          image_url?: string | null
          is_beginner_friendly?: boolean | null
          is_student_only?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          location?: string | null
          max_participants?: number | null
          mode?: string
          organizer?: string
          popularity_score?: number | null
          prize?: string | null
          prize_pool_inr?: number | null
          prize_pool_text?: string | null
          raw?: Json | null
          registration_deadline?: string | null
          registration_url?: string | null
          saves_count?: number | null
          search_tsv?: unknown
          searchable_text?: string | null
          source_slug?: string
          start_date?: string
          status?: string
          tags?: string[] | null
          team_size_max?: number | null
          team_size_min?: number | null
          themes?: string[]
          title?: string
          updated_at?: string | null
          verified_by?: string | null
          views_count?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hackathons_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hackathons_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hackradar_preferences: {
        Row: {
          city: string | null
          created_at: string
          has_completed_review: boolean | null
          interests: string[] | null
          max_distance_km: number | null
          notify_deadline_hours: number[] | null
          notify_new_match: boolean | null
          preferred_mode: string | null
          preferred_team_size: string | null
          skill_level: string | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          has_completed_review?: boolean | null
          interests?: string[] | null
          max_distance_km?: number | null
          notify_deadline_hours?: number[] | null
          notify_new_match?: boolean | null
          preferred_mode?: string | null
          preferred_team_size?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          city?: string | null
          created_at?: string
          has_completed_review?: boolean | null
          interests?: string[] | null
          max_distance_km?: number | null
          notify_deadline_hours?: number[] | null
          notify_new_match?: boolean | null
          preferred_mode?: string | null
          preferred_team_size?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      idea_details: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          section: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          section: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          section?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_details_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_documents: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_feedback: {
        Row: {
          content: string
          created_at: string | null
          feedback_type: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feedback_type?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feedback_type?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      idea_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_validations: {
        Row: {
          breakdown: Json
          confidence: number
          created_at: string | null
          id: string
          overall_score: number
          risk_level: string
          suggestions: Json | null
          user_id: string
          version_id: string | null
          workspace_id: string
        }
        Insert: {
          breakdown?: Json
          confidence?: number
          created_at?: string | null
          id?: string
          overall_score?: number
          risk_level?: string
          suggestions?: Json | null
          user_id: string
          version_id?: string | null
          workspace_id: string
        }
        Update: {
          breakdown?: Json
          confidence?: number
          created_at?: string | null
          id?: string
          overall_score?: number
          risk_level?: string
          suggestions?: Json | null
          user_id?: string
          version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_validations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_versions: {
        Row: {
          breakdown: Json
          confidence: number
          created_at: string
          diff_from_prev: Json | null
          id: string
          idea_snapshot: Json
          risk: string
          score: number
          user_id: string
          version: number
          workspace_id: string
        }
        Insert: {
          breakdown?: Json
          confidence?: number
          created_at?: string
          diff_from_prev?: Json | null
          id?: string
          idea_snapshot?: Json
          risk?: string
          score?: number
          user_id: string
          version?: number
          workspace_id: string
        }
        Update: {
          breakdown?: Json
          confidence?: number
          created_at?: string
          diff_from_prev?: Json | null
          id?: string
          idea_snapshot?: Json
          risk?: string
          score?: number
          user_id?: string
          version?: number
          workspace_id?: string
        }
        Relationships: []
      }
      idea_votes: {
        Row: {
          created_at: string | null
          id: string
          idea_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idea_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idea_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_workspaces: {
        Row: {
          created_at: string | null
          domain: string
          health_score: number | null
          id: string
          idea_name: string
          one_liner: string | null
          progress_percent: number
          stage: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain?: string
          health_score?: number | null
          id?: string
          idea_name: string
          one_liner?: string | null
          progress_percent?: number
          stage?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          health_score?: number | null
          id?: string
          idea_name?: string
          one_liner?: string | null
          progress_percent?: number
          stage?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          comments_count: number | null
          created_at: string | null
          description: string
          domain: string
          id: string
          is_ai_generated: boolean | null
          is_published: boolean | null
          problem_statement: string | null
          solution: string | null
          target_market: string | null
          title: string
          updated_at: string | null
          user_id: string
          votes_count: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string | null
          description: string
          domain: string
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          problem_statement?: string | null
          solution?: string | null
          target_market?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          votes_count?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string | null
          description?: string
          domain?: string
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          problem_statement?: string | null
          solution?: string | null
          target_market?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_matches: {
        Row: {
          created_at: string | null
          id: string
          investor_id: string
          match_score: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          investor_id: string
          match_score?: number
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          investor_id?: string
          match_score?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_matches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          firm: string | null
          focus_domains: string[] | null
          id: string
          location: string | null
          name: string
          past_investments: Json | null
          stage_preference: string[] | null
          ticket_size_max: number | null
          ticket_size_min: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          firm?: string | null
          focus_domains?: string[] | null
          id?: string
          location?: string | null
          name: string
          past_investments?: Json | null
          stage_preference?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          firm?: string | null
          focus_domains?: string[] | null
          id?: string
          location?: string | null
          name?: string
          past_investments?: Json | null
          stage_preference?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number | null
          company_logo_url: string | null
          company_name: string
          created_at: string | null
          description: string
          experience_level: string | null
          id: string
          is_active: boolean | null
          job_type: string
          location: string
          posted_by: string
          requirements: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
          work_type: string
        }
        Insert: {
          applications_count?: number | null
          company_logo_url?: string | null
          company_name: string
          created_at?: string | null
          description: string
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_type: string
          location: string
          posted_by: string
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          work_type: string
        }
        Update: {
          applications_count?: number | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string | null
          description?: string
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string
          location?: string
          posted_by?: string
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lessons: Json
          level: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lessons?: Json
          level?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lessons?: Json
          level?: string
          title?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          breakdown: Json
          computed_at: string
          id: string
          score: number
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          computed_at?: string
          id?: string
          score?: number
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          computed_at?: string
          id?: string
          score?: number
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_applications: {
        Row: {
          admin_feedback: string | null
          bio: string
          created_at: string | null
          expertise_areas: string[]
          id: string
          linkedin_url: string | null
          motivation: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          years_experience: number
        }
        Insert: {
          admin_feedback?: string | null
          bio: string
          created_at?: string | null
          expertise_areas: string[]
          id?: string
          linkedin_url?: string | null
          motivation: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          years_experience: number
        }
        Update: {
          admin_feedback?: string | null
          bio?: string
          created_at?: string | null
          expertise_areas?: string[]
          id?: string
          linkedin_url?: string | null
          motivation?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "mentor_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_stories: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          media_url: string | null
          mentor_id: string
          story_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          media_url?: string | null
          mentor_id: string
          story_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          media_url?: string | null
          mentor_id?: string
          story_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_stories_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      mentors: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string | null
          expertise: string[]
          id: string
          is_verified: boolean | null
          linkedin_url: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          expertise?: string[]
          id?: string
          is_verified?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          expertise?: string[]
          id?: string
          is_verified?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mentors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          target_id: string | null
          target_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_deck_sources: {
        Row: {
          created_at: string | null
          extracted_text: string | null
          file_name: string
          file_url: string
          id: string
          pitch_deck_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          extracted_text?: string | null
          file_name: string
          file_url: string
          id?: string
          pitch_deck_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          extracted_text?: string | null
          file_name?: string
          file_url?: string
          id?: string
          pitch_deck_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_deck_sources_pitch_deck_id_fkey"
            columns: ["pitch_deck_id"]
            isOneToOne: false
            referencedRelation: "pitch_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          slides: Json
          speaker_notes: Json
          style: string
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string
          slides?: Json
          speaker_notes?: Json
          style?: string
          title?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          slides?: Json
          speaker_notes?: Json
          style?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_decks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_feedback: {
        Row: {
          clarity_score: number | null
          created_at: string | null
          feedback: Json
          funding_stage: string | null
          id: string
          persuasiveness_score: number | null
          pitch_content: string
          startup_id: string | null
          target_audience: string | null
          user_id: string
        }
        Insert: {
          clarity_score?: number | null
          created_at?: string | null
          feedback: Json
          funding_stage?: string | null
          id?: string
          persuasiveness_score?: number | null
          pitch_content: string
          startup_id?: string | null
          target_audience?: string | null
          user_id: string
        }
        Update: {
          clarity_score?: number | null
          created_at?: string | null
          feedback?: Json
          funding_stage?: string | null
          id?: string
          persuasiveness_score?: number | null
          pitch_content?: string
          startup_id?: string | null
          target_audience?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_feedback_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_shares: {
        Row: {
          created_at: string | null
          id: string
          investor_id: string
          message: string | null
          pitch_deck_id: string | null
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          investor_id: string
          message?: string | null
          pitch_deck_id?: string | null
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          investor_id?: string
          message?: string | null
          pitch_deck_id?: string | null
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_shares_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_shares_pitch_deck_id_fkey"
            columns: ["pitch_deck_id"]
            isOneToOne: false
            referencedRelation: "pitch_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_shares_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "idea_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_insights: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json
          severity: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          severity?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          severity?: string
          title?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          media_url: string | null
          shares_count: number | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          media_url?: string | null
          shares_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          media_url?: string | null
          shares_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          ban_reason: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          email: string
          experience_years: number | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          interests: string[] | null
          is_banned: boolean
          is_investor: boolean | null
          is_mentor: boolean | null
          is_onboarded: boolean | null
          is_recruiter: boolean | null
          is_talent: boolean | null
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          skills: string[] | null
          tech_stack: string[] | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          interests?: string[] | null
          is_banned?: boolean
          is_investor?: boolean | null
          is_mentor?: boolean | null
          is_onboarded?: boolean | null
          is_recruiter?: boolean | null
          is_talent?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          tech_stack?: string[] | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean
          is_investor?: boolean | null
          is_mentor?: boolean | null
          is_onboarded?: boolean | null
          is_recruiter?: boolean | null
          is_talent?: boolean | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          tech_stack?: string[] | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reposts: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          original_post_id: string | null
          original_short_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          original_post_id?: string | null
          original_short_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          original_post_id?: string | null
          original_short_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_original_short_id_fkey"
            columns: ["original_short_id"]
            isOneToOne: false
            referencedRelation: "shorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_analysis: {
        Row: {
          ai_risks: Json
          created_at: string
          id: string
          risk_level: string
          rule_flags: Json
          user_id: string
          version_id: string | null
          workspace_id: string
        }
        Insert: {
          ai_risks?: Json
          created_at?: string
          id?: string
          risk_level?: string
          rule_flags?: Json
          user_id: string
          version_id?: string | null
          workspace_id: string
        }
        Update: {
          ai_risks?: Json
          created_at?: string
          id?: string
          risk_level?: string
          rule_flags?: Json
          user_id?: string
          version_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shorts: {
        Row: {
          category: string
          comments_count: number | null
          created_at: string | null
          creator_id: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          shares_count: number | null
          thumbnail_url: string | null
          title: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          category: string
          comments_count?: number | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          thumbnail_url?: string | null
          title: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          category?: string
          comments_count?: number | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shorts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_type: string
          investor_id: string
          message: string | null
          startup_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_type?: string
          investor_id: string
          message?: string | null
          startup_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_type?: string
          investor_id?: string
          message?: string | null
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_interests_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_team_members: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          linkedin_url: string | null
          name: string
          role: string
          startup_id: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          role: string
          startup_id: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          role?: string
          startup_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_team_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          amount_raised: number | null
          created_at: string | null
          description: string
          founded_date: string | null
          founder_id: string
          funding_status: string | null
          growth_rate: string | null
          id: string
          industry: string
          investment_amount_sought: number | null
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          pitch_deck_url: string | null
          revenue: number | null
          seeking_investment: boolean | null
          stage: string
          tagline: string | null
          updated_at: string | null
          user_count: number | null
          website_url: string | null
        }
        Insert: {
          amount_raised?: number | null
          created_at?: string | null
          description: string
          founded_date?: string | null
          founder_id: string
          funding_status?: string | null
          growth_rate?: string | null
          id?: string
          industry: string
          investment_amount_sought?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          pitch_deck_url?: string | null
          revenue?: number | null
          seeking_investment?: boolean | null
          stage: string
          tagline?: string | null
          updated_at?: string | null
          user_count?: number | null
          website_url?: string | null
        }
        Update: {
          amount_raised?: number | null
          created_at?: string | null
          description?: string
          founded_date?: string | null
          founder_id?: string
          funding_status?: string | null
          growth_rate?: string | null
          id?: string
          industry?: string
          investment_amount_sought?: number | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          pitch_deck_url?: string | null
          revenue?: number | null
          seeking_investment?: boolean | null
          stage?: string
          tagline?: string | null
          updated_at?: string | null
          user_count?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_plans: {
        Row: {
          budget_constraints: string | null
          created_at: string | null
          id: string
          idea_description: string
          idea_id: string | null
          strategy: Json
          target_market: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_constraints?: string | null
          created_at?: string | null
          id?: string
          idea_description: string
          idea_id?: string | null
          strategy: Json
          target_market?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_constraints?: string | null
          created_at?: string | null
          id?: string
          idea_description?: string
          idea_id?: string | null
          strategy?: Json
          target_market?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_plans_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          availability: string | null
          bio: string | null
          created_at: string | null
          expected_salary_max: number | null
          expected_salary_min: number | null
          experience_years: number | null
          id: string
          is_featured: boolean | null
          portfolio_url: string | null
          preferred_work_type: string[] | null
          resume_url: string | null
          skills: string[]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          experience_years?: number | null
          id?: string
          is_featured?: boolean | null
          portfolio_url?: string | null
          preferred_work_type?: string[] | null
          resume_url?: string | null
          skills?: string[]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          created_at?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          experience_years?: number | null
          id?: string
          is_featured?: boolean | null
          portfolio_url?: string | null
          preferred_work_type?: string[] | null
          resume_url?: string | null
          skills?: string[]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_memory: {
        Row: {
          goals: string[]
          industry: string | null
          interests: string[]
          memory_summary: string | null
          preferred_ai_style: string | null
          preferred_industry: string | null
          role: string | null
          startup_description: string | null
          startup_name: string | null
          startup_stage: string | null
          target_users: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          goals?: string[]
          industry?: string | null
          interests?: string[]
          memory_summary?: string | null
          preferred_ai_style?: string | null
          preferred_industry?: string | null
          role?: string | null
          startup_description?: string | null
          startup_name?: string | null
          startup_stage?: string | null
          target_users?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          goals?: string[]
          industry?: string | null
          interests?: string[]
          memory_summary?: string | null
          preferred_ai_style?: string | null
          preferred_industry?: string | null
          role?: string | null
          startup_description?: string | null
          startup_name?: string | null
          startup_stage?: string | null
          target_users?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          badges: Json
          completed_lessons: Json
          created_at: string | null
          id: string
          last_active: string | null
          points: number
          streak_days: number
          track_id: string | null
          user_id: string
        }
        Insert: {
          badges?: Json
          completed_lessons?: Json
          created_at?: string | null
          id?: string
          last_active?: string | null
          points?: number
          streak_days?: number
          track_id?: string | null
          user_id: string
        }
        Update: {
          badges?: Json
          completed_lessons?: Json
          created_at?: string | null
          id?: string
          last_active?: string | null
          points?: number
          streak_days?: number
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_cache_version: {
        Row: {
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_connection_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      admin_ban_user: {
        Args: { _banned: boolean; _reason?: string; _user_id: string }
        Returns: undefined
      }
      assign_admin_role: { Args: { _user_id: string }; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "student"
        | "innovator"
        | "startup"
        | "mentor"
        | "investor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "student",
        "innovator",
        "startup",
        "mentor",
        "investor",
      ],
    },
  },
} as const
