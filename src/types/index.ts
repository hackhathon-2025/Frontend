export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  competitionId?: string | null;
  scoringRules?: any;
  inviteCode?: string;
  memberCount?: number;
  competitionType?: string;
  competitionName?: string;
  owner?: {
    id: string;
    name: string;
  };
}

export interface GroupMember {
  id: number;
  userId: string;
  groupId: string;
  joinedAt: string;
  user?: User;
  group?: Group;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  ranking: number;
}

export interface LiveScore {
  set: number;
  game: number;
  point: string;
}

export interface ScoreSets {
  p1: number[];
  p2: number[];
}

export interface MatchResult {
  id: number;
  match_id: number;
  winner_id: number | null;
  score_sets: ScoreSets | null;
  live_score: LiveScore | null;
  duration: number | null;
  winner: Player | null;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  competition_id: number;
  player1_id: number;
  player2_id: number;
  start_time: string; // Format TIMESTAMP
  round: string; // Ex: '1er Tour', 'Demi-Finale'
  status: string;
  player1: string | Player;
  player2: string | Player;
  result?: MatchResult | null;
}

export interface Prediction {
  id: string;
  userId: string;
  groupId: string;
  matchId: string;
  winnerId: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  group?: Group;
  match?: Match;
  pointsEarned?: number;
}
