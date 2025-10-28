import { Group } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ApiGroup {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  competitionId: string | null;
  scoringRule: string | null;
  inviteCode?: string | null;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
  };
}

function mapApiGroupToGroup(apiGroup: ApiGroup): Group {
  return {
    id: apiGroup.id,
    name: apiGroup.name,
    description: apiGroup.description,
    isPublic: apiGroup.isPublic,
    ownerId: apiGroup.ownerId,
    competitionId: apiGroup.competitionId,
    createdAt: apiGroup.createdAt,
    scoringRules: apiGroup.scoringRule ? JSON.parse(apiGroup.scoringRule) : undefined,
    inviteCode: apiGroup.inviteCode || undefined,
    owner: apiGroup.owner,
  };
}

export interface GroupMemberResponse {
  id: string;
  username: string;
  email: string;
}

export interface GroupMembersData {
  groupId: string;
  name: string;
  members: GroupMemberResponse[];
}

export const groupService = {
  async getMyGroups(): Promise<Group[]> {
    const response = await fetch(`${API_BASE_URL}/api/groups/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch my groups: ${response.statusText}`);
    }

    const apiGroups: ApiGroup[] = await response.json();
    return apiGroups.map(mapApiGroupToGroup);
  },

  async getPublicGroups(take = 20, skip = 0): Promise<{ data: Group[]; pagination: { total: number; skip: number; take: number } }> {
    const response = await fetch(`${API_BASE_URL}/api/groups?take=${take}&skip=${skip}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch public groups: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      data: result.data.map(mapApiGroupToGroup),
      pagination: result.pagination,
    };
  },

  async getGroupMembers(groupId: string): Promise<GroupMembersData> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch group members: ${response.statusText}`);
    }

    return response.json();
  },

  async joinGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to join group: ${response.statusText}`);
    }
  },

  async joinGroupByCode(inviteCode: string): Promise<{ message: string; group: Group }> {
    const response = await fetch(`${API_BASE_URL}/api/groups/join-by-code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ inviteCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to join group: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      message: result.message,
      group: mapApiGroupToGroup(result.group),
    };
  },

  async leaveGroup(groupId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to leave group: ${response.statusText}`);
    }
  },

  async createGroup(groupData: {
    name: string;
    description: string;
    ownerId: string;
    isPublic: boolean;
    competitionId: string;
    scoringRules: object;
  }): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create group: ${response.statusText}`);
    }

    const apiGroup: ApiGroup = await response.json();
    return mapApiGroupToGroup(apiGroup);
  },

  async inviteUser(groupId: string, inviteeId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ inviteeId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to invite user: ${response.statusText}`);
    }
  },

  async banUser(groupId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/ban`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to ban user: ${response.statusText}`);
    }
  },

  async unbanUser(groupId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/unban`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to unban user: ${response.statusText}`);
    }
  },

  async getBannedUsers(groupId: string): Promise<GroupMemberResponse[]> {
    const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/banned`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get banned users: ${response.statusText}`);
    }

    const result = await response.json();
    return result.bannedUsers;
  },
};
