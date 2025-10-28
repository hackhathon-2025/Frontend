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
  createdAt: string;
  updatedAt: string;
  competitionType: string;
  competitionName: string;
  scoringRules: any; // Define a more specific interface for this if possible
  inviteCode?: string;
  memberCount?: number;
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
  id: string;
  competition: string;
  player1: string;
  player2: string;
  startTime: string;
  score: string | null;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
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
