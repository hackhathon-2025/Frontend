export interface Group {
  id: string;
  name: string;
  owner_id: string;
  is_public: boolean;
  invite_code?: string;
  scoring_rules?: string;
  competition_type?: string;
  competition_name?: string;
  description?: string | null;
  member_count?: number;
  created_at?: string;
}
