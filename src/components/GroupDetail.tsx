import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
} from 'lucide-react';
import MatchManager from './MatchManager';
import PredictionsView from './PredictionsView';
import Leaderboard from './Leaderboard';
import GroupSettings from './GroupSettings';

import { Group } from '../types/Group';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

type Tab = 'predictions' | 'leaderboard' | 'members' | 'admin';

export default function GroupDetail({ group, onBack }: GroupDetailProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('predictions');
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const isOwner = group.owner_id === profile?.id;
  const isAdmin = members.find((m) => m.user_id === profile?.id)?.role === 'admin';

  useEffect(() => {
    loadMembers();

    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${group.id}`,
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  async function loadMembers() {
    const { data, error } = await supabase
      .from('group_members')
      .select('id, user_id, role, profiles(username, avatar_url)')
      .eq('group_id', group.id)
      .eq('is_banned', false)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

    setMembers(data as any);
  }

  function copyInviteCode() {
    if (group.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
    } else {
      console.error('Invite code is undefined');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeMember(memberId: string, userId: string) {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function toggleRole(memberId: string, currentRole: string) {
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      const { error } = await supabase.from('group_members').update({ role: newRole }).eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
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
                <div className="flex items-center gap-2 text-slate-300">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <span>
                    {group.competition_type} - {group.competition_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>{members.length} membre(s)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">Code d'invitation</p>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 font-mono text-lg">{group.invite_code}</code>
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
          {activeTab === 'predictions' && group.scoring_rules && (
            <PredictionsView group={{ ...group, scoring_rules: group.scoring_rules }} />
          )}
          {activeTab === 'leaderboard' && <Leaderboard groupId={group.id} />}
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
                    {isOwner && member.user_id !== profile?.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRole(member.id, member.role)}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        >
                          {member.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                        </button>
                        <button
                          onClick={() => removeMember(member.id, member.user_id)}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                        >
                          Retirer
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
              <MatchManager group={group} isOwner={isOwner} isAdmin={isAdmin} />
              {isOwner && <GroupSettings group={group} onUpdate={onBack} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
