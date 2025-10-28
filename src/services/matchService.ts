import { Match } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ApiPlayer {
  id: number;
  name: string;
  country: string;
  ranking: number;
}

export interface ApiMatch {
  id: number;
  competition_id: number;
  player1_id: number;
  player2_id: number;
  start_time: string;
  round: string;
  status: string;
  player1?: ApiPlayer;
  player2?: ApiPlayer;
  score?: string | null;
}

function mapApiMatchToMatch(apiMatch: ApiMatch): Match {
  return {
    id: apiMatch.id,
    competition_id: apiMatch.competition_id,
    player1_id: apiMatch.player1_id,
    player2_id: apiMatch.player2_id,
    start_time: apiMatch.start_time,
    round: apiMatch.round,
    status: apiMatch.status,
    player1: apiMatch.player1 || `Player ${apiMatch.player1_id}`,
    player2: apiMatch.player2 || `Player ${apiMatch.player2_id}`,
    score: apiMatch.score,
  };
}

export const matchService = {
  async getAllMatches(): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/api/matches`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.statusText}`);
    }

    const apiMatches: ApiMatch[] = await response.json();
    return apiMatches.map(mapApiMatchToMatch);
  },

  async getMatchById(matchId: number): Promise<Match> {
    const response = await fetch(`${API_BASE_URL}/api/matches/match/${matchId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch match: ${response.statusText}`);
    }

    const apiMatch: ApiMatch = await response.json();
    return mapApiMatchToMatch(apiMatch);
  },

  async getMatchesByCompetition(competitionId: string | number): Promise<Match[]> {
    const response = await fetch(`${API_BASE_URL}/api/matches/comp/${competitionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch competition matches: ${response.statusText}`);
    }

    const apiMatches: ApiMatch[] = await response.json();
    return apiMatches.map(mapApiMatchToMatch);
  },
};
