import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          is_public: boolean;
          competition_type: string;
          competition_name: string;
          invite_code: string;
          scoring_rules: any;
          created_at: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
          is_banned: boolean;
        };
      };
      matches: {
        Row: {
          id: string;
          group_id: string;
          home_team: string;
          away_team: string;
          scheduled_at: string;
          home_score: number | null;
          away_score: number | null;
          status: 'scheduled' | 'live' | 'finished';
          created_at: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          predicted_home_score: number;
          predicted_away_score: number;
          points_earned: number;
          created_at: string;
          updated_at: string;
        };
      };
      leaderboards: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          total_points: number;
          correct_predictions: number;
          updated_at: string;
        };
      };
    };
  };
};