import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, LogOut, Trophy, Search, Crown, User as UserIcon } from 'lucide-react';

import { Group } from '../types';
import { useNavigate } from 'react-router-dom';

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
    scoringRules: { win: 3, draw: 1, loss: 0 }
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
    scoringRules: { win: 2, loss: 0 }
  }
];

const mockPublicGroups: Group[] = [
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
    scoringRules: { win: 1 }
  }
];

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'public'>('my-groups');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setGroups(mockGroups);
    setPublicGroups(mockPublicGroups);
    setLoading(false);
  }, []);

  function joinGroupByCode() {
    if (!inviteCode.trim()) return;
    const group = [...mockGroups, ...mockPublicGroups].find(g => g.inviteCode === inviteCode.trim());
    if (group) {
      if (!groups.some(g => g.id === group.id)) {
        setGroups([...groups, group]);
      }
      setInviteCode('');
    } else {
      alert('Code invalide');
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups([...groups, newGroup]);
    navigate('/dashboard'); // Navigate back to dashboard after creation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">PronostiX</h1>
              <p className="text-slate-400">Bienvenue, {profile?.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              Mon Compte
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Code d'invitation"
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={joinGroupByCode}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
                Rejoindre
              </button>
            </div>
            <button
              onClick={() => navigate('/create-group')}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Créer un groupe
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'my-groups'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            Mes groupes ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'public'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            Groupes publics
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'my-groups' ? groups : publicGroups).map((group) => {
              const isOwner = group.ownerId === profile?.id;
              const isMember = groups.some((g) => g.id === group.id);

              return (
                <div
                  key={group.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-all cursor-pointer"
                  onClick={() => isMember && navigate(`/groups/${group.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {group.name}
                      {isOwner && <Crown className="w-5 h-5 text-yellow-500" />}
                    </h3>
                    <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                      {group.isPublic ? 'Public' : 'Privé'}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{group.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium">{group.competitionType}</span>
                    </div>
                    <div className="text-slate-400 text-sm ml-6">{group.competitionName}</div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount || 0} membre(s)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeTab === 'my-groups' && groups.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Aucun groupe</h3>
            <p className="text-slate-500">
              Créez votre premier groupe ou rejoignez-en un avec un code d'invitation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}