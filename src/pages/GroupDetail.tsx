import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Settings,
  Copy,
  Check,
  Crown,
  TrendingUp,
  Tv,
} from 'lucide-react';
import PredictionsView from '../components/PredictionsView';
import MatchesView from '../components/MatchesView';
import Leaderboard from '../components/Leaderboard';
import GroupSettings from '../components/GroupSettings';

import { Group, GroupMember, Match } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { matchService } from '../services/matchService';

interface Member extends GroupMember {
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  role?: string;
}

type Tab = 'predictions' | 'matches' | 'leaderboard' | 'members' | 'admin';

const mockMembers: Member[] = [
    {
        id: 1,
        userId: '1',
        groupId: '1',
        joinedAt: new Date().toISOString(),
        profiles: {
            username: 'owner_user',
            avatar_url: null,
        },
    },
    {
        id: 2,
        userId: '2',
        groupId: '1',
        joinedAt: new Date().toISOString(),
        profiles: {
            username: 'admin_user',
            avatar_url: null,
        },
    },
    {
        id: 3,
        userId: '3',
        groupId: '1',
        joinedAt: new Date().toISOString(),
        profiles: {
            username: 'member_user',
            avatar_url: null,
        },
    },
];

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Pronos Roland Garros',
    description: 'Le groupe pour les fans de tennis et de Roland Garros.',
    isPublic: true,
    ownerId: '1',
    competitionType: 'Tennis',
    competitionName: 'Roland Garros 2025',
    createdAt: new Date().toISOString(),
    inviteCode: 'RG2025',
    memberCount: 12,
    scoringRules: { exact_score: 3, correct_winner: 1, correct_draw: 0 }
  },
  {
    id: '2',
    name: 'Club des amateurs de Wimbledon',
    description: 'Ici on parle que de Tennis, pas de footix.',
    isPublic: false,
    ownerId: '2',
    competitionType: 'Tennis',
    competitionName: 'Wimbledon 2025',
    createdAt: new Date().toISOString(),
    inviteCode: 'WIMBLEDON',
    memberCount: 8,
    scoringRules: { exact_score: 2, correct_winner: 0, correct_draw: 0 }
  },
  {
    id: '3',
    name: 'US Open 2025',
    description: 'Un groupe public pour tous les fans de tennis.',
    isPublic: true,
    ownerId: '3',
    competitionType: 'Tennis',
    competitionName: 'US Open 2025',
    createdAt: new Date().toISOString(),
    inviteCode: 'USOPEN',
    memberCount: 25,
    scoringRules: { exact_score: 1, correct_winner: 0, correct_draw: 0 }
  }
];

export default function GroupDetail() {
  const { profile } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('predictions');
  const [members, setMembers] = useState<Member[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [copied, setCopied] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    async function fetchGroupData() {
      if (!groupId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Fetch both group list and members
        const [myGroups, publicGroupsData, membersData] = await Promise.all([
          groupService.getMyGroups(),
          groupService.getPublicGroups(100, 0),
          groupService.getGroupMembers(groupId).catch(() => ({ groupId, name: '', members: [] })),
        ]);

        // Find the group in either my groups or public groups
        const allGroups = [...myGroups, ...publicGroupsData.data];
        const foundGroup = allGroups.find(g => g.id === groupId);

        if (foundGroup) {
          setGroup(foundGroup);
          // Map members data to the format expected by the component
          const formattedMembers = membersData.members.map((member, index) => ({
            id: index + 1,
            userId: member.id,
            groupId: groupId,
            joinedAt: new Date().toISOString(),
            profiles: {
              username: member.username,
              avatar_url: null,
            },
            role: member.id === foundGroup.ownerId ? 'owner' : 'member',
          }));
          setMembers(formattedMembers as Member[]);

          // Fetch matches if the group has a competition
          if (foundGroup.competitionId) {
            setLoadingMatches(true);
            try {
              const competitionMatches = await matchService.getMatchesByCompetition(foundGroup.competitionId);
              setMatches(competitionMatches);
            } catch (error) {
              console.error('Error fetching matches:', error);
              setMatches([]);
            } finally {
              setLoadingMatches(false);
            }
          }
        } else {
          // Fallback to mock data if not found
          const mockGroup = mockGroups.find(g => g.id === groupId);
          if (mockGroup) {
            setGroup(mockGroup);
            setMembers(mockMembers);
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        // Fallback to mock data
        const foundGroup = mockGroups.find(g => g.id === groupId);
        if (foundGroup) {
          setGroup(foundGroup);
          setMembers(mockMembers);
        } else {
          navigate('/dashboard');
        }
      }
    }

    fetchGroupData();
  }, [groupId, navigate]);

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du groupe...</div>
      </div>
    );
  }

  const isOwner = group.ownerId === profile?.id;
  const isAdmin = members.find((m) => m.userId === profile?.id)?.role === 'admin';

  function copyInviteCode() {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
    } else {
      console.error('Invite code is undefined');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function banMember(userId: string) {
    if (!group || !confirm('Êtes-vous sûr de vouloir bannir ce membre ? Il ne pourra plus rejoindre ce groupe.')) return;
    try {
      await groupService.banUser(group.id, userId);
      // Refresh members
      const membersData = await groupService.getGroupMembers(group.id);
      const formattedMembers = membersData.members.map((member, index) => ({
        id: index + 1,
        userId: member.id,
        groupId: group.id,
        joinedAt: new Date().toISOString(),
        profiles: {
          username: member.username,
          avatar_url: null,
        },
        role: member.id === group.ownerId ? 'owner' : 'member',
      }));
      setMembers(formattedMembers as Member[]);
      alert('Membre banni avec succès');
    } catch (error) {
      console.error('Error banning member:', error);
      alert('Erreur lors du bannissement du membre');
    }
  }

  async function handleLeaveGroup() {
    if (!group || !confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;
    try {
      await groupService.leaveGroup(group.id);
      alert('Vous avez quitté le groupe avec succès');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error leaving group:', error);
      alert(error.message || 'Erreur lors de la sortie du groupe');
    }
  }

  async function toggleRole(memberId: number, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setMembers(
      members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux groupes
        </button>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                {isOwner && <Crown className="w-6 h-6 text-yellow-500" />}
              </div>
              {group.description && <p className="text-slate-400 mb-4">{group.description}</p>}
              <div className="flex flex-wrap gap-4">
                {(group.competitionType || group.competitionName) && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <span>
                      {group.competitionType && group.competitionName
                        ? `${group.competitionType} - ${group.competitionName}`
                        : group.competitionType || group.competitionName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>{members.length} membre(s)</span>
                </div>
              </div>
              {!isOwner && (
                <button
                  onClick={handleLeaveGroup}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium"
                >
                  Quitter le groupe
                </button>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">Code d'invitation</p>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 font-mono text-lg">{group.inviteCode}</code>
                <button
                  onClick={copyInviteCode}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'predictions'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Pronostics
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'matches'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            <Tv className="w-5 h-5" />
            Matchs
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Classement
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === 'members'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Membres
          </button>
          {(isOwner || isAdmin) && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              Administration
            </button>
          )}
        </div>

        <div>
          {activeTab === 'predictions' && (
            <PredictionsView
              group={group}
              matches={matches}
              loadingMatches={loadingMatches}
            />
          )}
          {activeTab === 'matches' && (
            <MatchesView
              matches={matches}
              loadingMatches={loadingMatches}
              competitionId={group.competitionId}
            />
          )}
          {activeTab === 'leaderboard' && group.id && <Leaderboard groupId={group.id} />}
          {activeTab === 'members' && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Membres du groupe</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.profiles.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.profiles.username}</p>
                        <p className="text-slate-400 text-sm capitalize">{member.role}</p>
                      </div>
                    </div>
                    {isOwner && member.userId !== profile?.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRole(member.id, member.role)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        >
                          {member.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                        </button>
                        <button
                          onClick={() => banMember(member.userId)}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                        >
                          Bannir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'admin' && (isOwner || isAdmin) && (
            <>
              {isOwner && <GroupSettings group={group} onUpdate={() => navigate('/dashboard')} />}
              {!isOwner && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
                  <p className="text-slate-400">
                    Seul le propriétaire du groupe peut modifier les paramètres.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
