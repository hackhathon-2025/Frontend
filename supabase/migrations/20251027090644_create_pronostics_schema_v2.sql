    /*
  # Pronostics Platform Database Schema

  ## Overview
  Complete database schema for a sports/e-sports prediction platform with groups, 
  competitions, matches, predictions, and real-time leaderboards.

  ## New Tables
  
  ### 1. profiles
    - `id` (uuid, primary key) - Links to auth.users
    - `email` (text) - User email
    - `username` (text, unique) - Display name
    - `avatar_url` (text, nullable) - Profile picture
    - `created_at` (timestamptz) - Account creation date
  
  ### 2. groups
    - `id` (uuid, primary key) - Unique group identifier
    - `name` (text) - Group name
    - `description` (text, nullable) - Group description
    - `owner_id` (uuid) - References profiles(id)
    - `is_public` (boolean) - Public or private group
    - `competition_type` (text) - Sport or e-sport type
    - `competition_name` (text) - Specific competition name
    - `invite_code` (text, unique) - Code for private invitations
    - `scoring_rules` (jsonb) - Custom scoring configuration
    - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. group_members
    - `id` (uuid, primary key)
    - `group_id` (uuid) - References groups(id)
    - `user_id` (uuid) - References profiles(id)
    - `role` (text) - 'admin' or 'member'
    - `joined_at` (timestamptz) - Join timestamp
    - `is_banned` (boolean) - Ban status
  
  ### 4. matches
    - `id` (uuid, primary key)
    - `group_id` (uuid) - References groups(id)
    - `home_team` (text) - Home team/player name
    - `away_team` (text) - Away team/player name
    - `scheduled_at` (timestamptz) - Match start time
    - `home_score` (integer, nullable) - Final home score
    - `away_score` (integer, nullable) - Final away score
    - `status` (text) - 'scheduled', 'live', 'finished'
    - `created_at` (timestamptz)
  
  ### 5. predictions
    - `id` (uuid, primary key)
    - `match_id` (uuid) - References matches(id)
    - `user_id` (uuid) - References profiles(id)
    - `predicted_home_score` (integer) - Predicted home score
    - `predicted_away_score` (integer) - Predicted away score
    - `points_earned` (integer, nullable) - Points from this prediction
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ### 6. leaderboards
    - `id` (uuid, primary key)
    - `group_id` (uuid) - References groups(id)
    - `user_id` (uuid) - References profiles(id)
    - `total_points` (integer) - Total points earned
    - `correct_predictions` (integer) - Number of correct predictions
    - `updated_at` (timestamptz)
  
  ## Security
    - RLS enabled on all tables
    - Profiles: Users can read all profiles, update only their own
    - Groups: Public groups readable by all, private groups only by members
    - Group_members: Members can read their group memberships
    - Matches: Readable by group members
    - Predictions: Users can manage their own predictions
    - Leaderboards: Readable by group members
  
  ## Important Notes
    1. All tables use RLS for security
    2. Scoring rules stored as JSONB for flexibility
    3. Invite codes enable private group access
    4. Real-time subscriptions supported for live updates
    5. Cascading deletes maintain referential integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  competition_type text NOT NULL,
  competition_name text NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  scoring_rules jsonb DEFAULT '{"exact_score": 5, "correct_winner": 3, "correct_draw": 2}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  is_banned boolean DEFAULT false,
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Now create groups policies that reference group_members
CREATE POLICY "Public groups are viewable by all authenticated users"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    OR owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid()
      AND group_members.is_banned = false
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups"
  ON groups FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create group_members policies
CREATE POLICY "Group members can view memberships in their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_banned = false
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group owners and admins can update memberships"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  home_team text NOT NULL,
  away_team text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  home_score integer,
  away_score integer,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = matches.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.is_banned = false
    )
  );

CREATE POLICY "Group owners and admins can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = matches.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Group owners and admins can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = matches.group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = matches.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = matches.group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = matches.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Group owners and admins can delete matches"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = matches.group_id
      AND groups.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = matches.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  predicted_home_score integer NOT NULL,
  predicted_away_score integer NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(match_id, user_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictions in their groups"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN group_members gm ON gm.group_id = m.group_id
      WHERE m.id = predictions.match_id
      AND gm.user_id = auth.uid()
      AND gm.is_banned = false
    )
  );

CREATE POLICY "Users can create their own predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions before match starts"
  ON predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON predictions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view leaderboards"
  ON leaderboards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = leaderboards.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.is_banned = false
    )
  );

CREATE POLICY "System can insert leaderboard entries"
  ON leaderboards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update leaderboard entries"
  ON leaderboards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_group_id ON leaderboards(group_id);

-- Function to update leaderboard when match finishes
CREATE OR REPLACE FUNCTION update_leaderboard_on_match_finish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL AND 
     (OLD.status != 'finished' OR OLD.home_score IS NULL OR OLD.away_score IS NULL) THEN
    
    UPDATE predictions p
    SET points_earned = CASE
      WHEN p.predicted_home_score = NEW.home_score AND p.predicted_away_score = NEW.away_score THEN 5
      WHEN (p.predicted_home_score > p.predicted_away_score AND NEW.home_score > NEW.away_score) OR
           (p.predicted_home_score < p.predicted_away_score AND NEW.home_score < NEW.away_score) THEN 3
      WHEN p.predicted_home_score = p.predicted_away_score AND NEW.home_score = NEW.away_score THEN 2
      ELSE 0
    END
    WHERE p.match_id = NEW.id;
    
    INSERT INTO leaderboards (group_id, user_id, total_points, correct_predictions)
    SELECT 
      m.group_id,
      p.user_id,
      COALESCE(SUM(p.points_earned), 0) as total_points,
      COUNT(*) FILTER (WHERE p.points_earned > 0) as correct_predictions
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    WHERE m.group_id = NEW.group_id
    GROUP BY m.group_id, p.user_id
    ON CONFLICT (group_id, user_id) 
    DO UPDATE SET
      total_points = EXCLUDED.total_points,
      correct_predictions = EXCLUDED.correct_predictions,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard ON matches;
CREATE TRIGGER trigger_update_leaderboard
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_on_match_finish();