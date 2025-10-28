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
  isPublic: boolean;
  ownerId: string;
  owner: Owner;
  createdAt: string;
  updatedAt: string;
  competitionName: string;
  description: string | null;
  inviteCode?: string;
  memberCount?: number;
}

export interface Owner {
  id: string;
  name: string;
}

export interface GroupMember {
  id: number;
  userId: string;
  groupId: string;
  joinedAt: string;
  user?: User;
  group?: Group;
}

export interface Match {
  id: number;
  competition_id: number;
  player1_id: number;
  player2_id: number;
  start_time: string; // Format TIMESTAMP
  round: string; // Ex: '1er Tour', 'Demi-Finale'
  status: string;
  player1: string;
  player2: string;
  score: string | null;
}

export interface Prediction {
  id: string;
  userId: string;
  groupId: string;
  matchId: string;
  winner: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  group?: Group;
  match?: Match;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  pointsEarned?: number;
}
