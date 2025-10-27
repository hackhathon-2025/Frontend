import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Plus, LogOut, Trophy, Search, Crown } from 'lucide-react';
import CreateGroup from './CreateGroup';
import GroupDetail from './GroupDetail';

import { Group } from '../types/Group';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'public'>('my-groups');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
    loadPublicGroups();
  }, []);

  async function loadGroups() {
    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', profile?.id)
        .eq('is_banned', false);

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberData.map((m) => m.group_id);
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_banned', false);

          return { ...group, member_count: count || 0, scoring_rules: group.scoring_rules || null };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPublicGroups() {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_banned', false);

          return { ...group, member_count: count || 0 };
        })
      );

      setPublicGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error loading public groups:', error);
    }
  }

  async function joinGroupByCode() {
    if (!inviteCode.trim()) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.trim())
        .maybeSingle();

      if (groupError) throw groupError;
      if (!group) {
        alert('Code invalide');
        return;
      }

      await joinGroup(group.id);
      setInviteCode('');
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function joinGroup(groupId: string) {
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: profile?.id,
        role: 'member',
      });

      if (error) {
        if (error.code === '23505') {
          alert('Vous êtes déjà membre de ce groupe');
        } else {
          throw error;
        }
        return;
      }

      await loadGroups();
      await loadPublicGroups();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (showCreateGroup) {
    return (
      <CreateGroup
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={() => {
          setShowCreateGroup(false);
          loadGroups();
        }}
      />
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup as Group}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

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
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
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
              onClick={() => setShowCreateGroup(true)}
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
              const isOwner = group.owner_id === profile?.id;
              const isMember = groups.some((g) => g.id === group.id);

              return (
                <div
                  key={group.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-all cursor-pointer"
                  onClick={() => isMember && setSelectedGroup(group)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {group.name}
                      {isOwner && <Crown className="w-5 h-5 text-yellow-500" />}
                    </h3>
                    <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                      {group.is_public ? 'Public' : 'Privé'}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{group.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium">{group.competition_type}</span>
                    </div>
                    <div className="text-slate-400 text-sm ml-6">{group.competition_name}</div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{group.member_count || 0} membre(s)</span>
                    </div>

                    {!isMember && activeTab === 'public' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinGroup(group.id);
                        }}
                        className="px-4 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Rejoindre
                      </button>
                    )}
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
