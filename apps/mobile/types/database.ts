export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type EventInsert = {
  id?: string;
  slug: string;
  title: string;
  neighborhood: string;
  vibes?: string[];
  day_label: string;
  time_label: string;
  venue: string;
  price?: string;
  featured?: boolean;
  hidden_gem?: boolean;
  sponsored?: boolean;
  trending_score?: number;
  time_windows?: string[];
  source?: string;
  source_type?: string;
  source_url?: string | null;
  ticket_url?: string | null;
  source_platform?: string;
  external_id?: string | null;
  starts_at?: string | null;
  dedupe_key?: string | null;
  description?: string;
  lat: number;
  lng: number;
  status?: string;
};

type SubmissionInsert = {
  id?: string;
  title: string;
  neighborhood: string;
  date_time: string;
  venue: string;
  email: string;
  tier?: string;
  pitch?: string;
  status?: string;
};

type DigestInsert = {
  id?: string;
  contact: string;
  channel: string;
};

type ListInsert = {
  id: string;
  title: string;
  by_line: string;
  description?: string;
  items?: string[];
  sort_order?: number;
};

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          neighborhood: string;
          vibes: string[];
          day_label: string;
          time_label: string;
          venue: string;
          price: string;
          featured: boolean;
          hidden_gem: boolean;
          sponsored: boolean;
          trending_score: number;
          time_windows: string[];
          source: string;
          source_type: string;
          source_url: string | null;
          ticket_url: string | null;
          source_platform: string;
          external_id: string | null;
          starts_at: string | null;
          dedupe_key: string | null;
          description: string;
          lat: number;
          lng: number;
          status: string;
          sells_tickets: boolean | null;
          submission_id: string | null;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: EventInsert;
        Update: Partial<EventInsert>;
        Relationships: [];
      };
      event_submissions: {
        Row: {
          id: string;
          title: string;
          neighborhood: string;
          date_time: string;
          venue: string;
          email: string;
          tier: string;
          pitch: string;
          status: string;
          payment_status: string | null;
          published_slug: string | null;
          ticketing_enabled: boolean | null;
          created_at: string;
        };
        Insert: SubmissionInsert;
        Update: Partial<SubmissionInsert>;
        Relationships: [];
      };
      digest_signups: {
        Row: {
          id: string;
          contact: string;
          channel: string;
          created_at: string;
        };
        Insert: DigestInsert;
        Update: Partial<DigestInsert>;
        Relationships: [];
      };
      curated_lists: {
        Row: {
          id: string;
          title: string;
          by_line: string;
          description: string;
          items: string[];
          event_slugs: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: ListInsert & { event_slugs?: string[] };
        Update: Partial<ListInsert & { event_slugs?: string[] }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          neighborhoods: string[];
          vibes: string[];
          push_enabled: boolean;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          neighborhoods?: string[];
          vibes?: string[];
          push_enabled?: boolean;
          onboarding_complete?: boolean;
          updated_at?: string;
        };
        Update: Partial<{
          email: string | null;
          display_name: string | null;
          neighborhoods: string[];
          vibes: string[];
          onboarding_complete: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
      saved_events: {
        Row: { user_id: string; event_slug: string; created_at: string };
        Insert: { user_id: string; event_slug: string };
        Update: Partial<{ user_id: string; event_slug: string }>;
        Relationships: [];
      };
      push_tokens: {
        Row: { id: string; user_id: string | null; token: string; platform: string; created_at: string };
        Insert: { user_id?: string | null; token: string; platform?: string };
        Update: Partial<{ user_id: string | null; token: string }>;
        Relationships: [];
      };
      sync_runs: {
        Row: {
          id: string;
          source_platform: string;
          inserted_count: number;
          skipped_duplicates: number;
          error_count: number;
          started_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_events: {
        Args: { query: string; max_results?: number };
        Returns: Database['public']['Tables']['events']['Row'][];
      };
      publish_submission: { Args: { submission_id: string }; Returns: string };
      archive_stale_events: { Args: Record<string, never>; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
