const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Competition {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  type: string;
  status: 'Upcoming' | 'Live' | 'Completed';
}

export const competitionService = {
  async getAllCompetitions(): Promise<Competition[]> {
    const response = await fetch(`${API_BASE_URL}/api/competitions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch competitions: ${response.statusText}`);
    }

    return response.json();
  },

  async getCompetitionById(competitionId: string | number): Promise<Competition> {
    const response = await fetch(`${API_BASE_URL}/api/competitions/${competitionId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch competition: ${response.statusText}`);
    }

    return response.json();
  },
};
