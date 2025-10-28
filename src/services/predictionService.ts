import { Prediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CreatePredictionData {
  matchId: number;
  groupId: string;
  winnerId: number;
}

export interface UpdatePredictionData {
  winnerId: number;
}

export const predictionService = {
  async createPrediction(data: CreatePredictionData): Promise<Prediction> {
    const response = await fetch(`${API_BASE_URL}/api/predictions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create prediction: ${response.statusText}`);
    }

    return await response.json();
  },

  async getMyPredictions(): Promise<Prediction[]> {
    const response = await fetch(`${API_BASE_URL}/api/predictions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch predictions: ${response.statusText}`);
    }

    return await response.json();
  },

  async getPredictionsByGroup(groupId: string): Promise<Prediction[]> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/group/${groupId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group predictions: ${response.statusText}`);
    }

    return await response.json();
  },

  async updatePrediction(predictionId: string, data: UpdatePredictionData): Promise<Prediction> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/${predictionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update prediction: ${response.statusText}`);
    }

    return await response.json();
  },

  async deletePrediction(predictionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/predictions/${predictionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete prediction: ${response.statusText}`);
    }
  },
};
