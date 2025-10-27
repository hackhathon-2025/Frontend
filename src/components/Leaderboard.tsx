import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, TrendingUp, Award, Medal } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_points: number;
  correct_predictions: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function Leaderboard({ groupId }: { groupId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    const channel = supabase
      .channel(`leaderboard:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboards',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  async function loadLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('id, user_id, total_points, correct_predictions, profiles(username, avatar_url)')
        .eq('group_id', groupId)
        .order('total_points', { ascending: false })
        .order('correct_predictions', { ascending: false });

      if (error) throw error;

      setEntries((data as any) || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
        <p className="text-slate-400">Chargement du classement...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
        <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">Pas encore de classement</h3>
        <p className="text-slate-500">
          Faites vos pronostics et attendez que les matchs se terminent pour voir le classement
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Classement général</h2>
            <p className="text-slate-400 text-sm">{entries.length} participant(s)</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-700">
        {entries.map((entry, index) => {
          const position = index + 1;
          const isTopThree = position <= 3;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-6 transition-colors ${
                isTopThree ? 'bg-slate-900/50' : 'hover:bg-slate-900/30'
              }`}
            >
              <div className="w-12 text-center">
                {isTopThree ? (
                  getMedalIcon(position)
                ) : (
                  <span className="text-slate-400 font-semibold text-lg">{position}</span>
                )}
              </div>

              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {entry.profiles.username[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg truncate">
                  {entry.profiles.username}
                </h3>
                <p className="text-slate-400 text-sm">
                  {entry.correct_predictions} pronostic(s) correct(s)
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{entry.total_points}</div>
                <div className="text-slate-400 text-sm">points</div>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length > 0 && (
        <div className="p-4 bg-slate-900/30 border-t border-slate-700">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Classement mis à jour en temps réel</span>
          </div>
        </div>
      )}
    </div>
  );
}
