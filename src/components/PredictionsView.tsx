import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, Play, CheckCircle, Save, Trophy } from 'lucide-react';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

interface Prediction {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number;
}

interface Group {
  id: string;
  scoring_rules: any;
}

export default function PredictionsView({ group }: { group: Group }) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pendingPredictions, setPendingPredictions] = useState<
    Record<string, { home: number; away: number }>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMatches();
    loadPredictions();

    const matchesChannel = supabase
      .channel(`predictions-matches:${group.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `group_id=eq.${group.id}`,
        },
        () => {
          loadMatches();
          loadPredictions();
        }
      )
      .subscribe();

    const predictionsChannel = supabase
      .channel(`predictions-user:${profile?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `user_id=eq.${profile?.id}`,
        },
        () => {
          loadPredictions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(predictionsChannel);
    };
  }, [group.id, profile?.id]);

  async function loadMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('group_id', group.id)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error loading matches:', error);
      return;
    }

    setMatches(data || []);
  }

  async function loadPredictions() {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', profile?.id);

    if (error) {
      console.error('Error loading predictions:', error);
      return;
    }

    const predictionsMap = (data || []).reduce((acc, pred) => {
      acc[pred.match_id] = pred;
      return acc;
    }, {} as Record<string, Prediction>);

    setPredictions(predictionsMap);
  }

  async function savePrediction(matchId: string) {
    const pending = pendingPredictions[matchId];
    if (!pending || pending.home < 0 || pending.away < 0) return;

    setLoading((prev) => ({ ...prev, [matchId]: true }));

    try {
      const existingPrediction = predictions[matchId];

      if (existingPrediction) {
        const { error } = await supabase
          .from('predictions')
          .update({
            predicted_home_score: pending.home,
            predicted_away_score: pending.away,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPrediction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('predictions').insert({
          match_id: matchId,
          user_id: profile?.id,
          predicted_home_score: pending.home,
          predicted_away_score: pending.away,
        });

        if (error) throw error;
      }

      setPendingPredictions((prev) => {
        const newPending = { ...prev };
        delete newPending[matchId];
        return newPending;
      });

      await loadPredictions();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, [matchId]: false }));
    }
  }

  function updatePrediction(matchId: string, field: 'home' | 'away', value: number) {
    setPendingPredictions((prev) => ({
      ...prev,
      [matchId]: {
        home: field === 'home' ? value : prev[matchId]?.home ?? predictions[matchId]?.predicted_home_score ?? 0,
        away: field === 'away' ? value : prev[matchId]?.away ?? predictions[matchId]?.predicted_away_score ?? 0,
      },
    }));
  }

  function getMatchStatus(match: Match) {
    const prediction = predictions[match.id];
    const pending = pendingPredictions[match.id];

    if (match.status === 'finished' && prediction) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
            <Trophy className="w-4 h-4" />
            +{prediction.points_earned} pts
          </div>
        </div>
      );
    }

    if (match.status === 'finished') {
      return (
        <div className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-sm">
          Terminé
        </div>
      );
    }

    if (pending || (!prediction && match.status === 'scheduled')) {
      return (
        <button
          onClick={() => savePrediction(match.id)}
          disabled={loading[match.id]}
          className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      );
    }

    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4 text-orange-400" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {matches.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-slate-400">Aucun match disponible pour le moment</p>
        </div>
      ) : (
        matches.map((match) => {
          const prediction = predictions[match.id];
          const pending = pendingPredictions[match.id];
          const isPastMatch = new Date(match.scheduled_at) < new Date() || match.status !== 'scheduled';

          return (
            <div
              key={match.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(match.status)}
                <span className="text-slate-400 text-sm">
                  {new Date(match.scheduled_at).toLocaleString('fr-FR')}
                </span>
                {match.status === 'live' && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                    EN DIRECT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
                <div className="text-right">
                  <div className="text-white font-semibold text-lg mb-2">{match.home_team}</div>
                  {!isPastMatch ? (
                    <input
                      type="number"
                      min="0"
                      value={
                        pending?.home ??
                        prediction?.predicted_home_score ??
                        ''
                      }
                      onChange={(e) =>
                        updatePrediction(match.id, 'home', parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="text-slate-400">
                      Pronostic: {prediction?.predicted_home_score ?? '-'}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  {match.home_score !== null && match.away_score !== null ? (
                    <div className="text-2xl font-bold text-emerald-400">
                      {match.home_score} : {match.away_score}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-600">vs</div>
                  )}
                </div>

                <div className="text-left">
                  <div className="text-white font-semibold text-lg mb-2">{match.away_team}</div>
                  {!isPastMatch ? (
                    <input
                      type="number"
                      min="0"
                      value={
                        pending?.away ??
                        prediction?.predicted_away_score ??
                        ''
                      }
                      onChange={(e) =>
                        updatePrediction(match.id, 'away', parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  ) : (
                    <div className="text-slate-400">
                      Pronostic: {prediction?.predicted_away_score ?? '-'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-700">
                {getMatchStatus(match)}
              </div>
            </div>
          );
        })
      )}

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <h3 className="text-white font-semibold mb-2">Règles de points</h3>
        <div className="space-y-1 text-sm text-slate-400">
          <div>Score exact: <span className="text-emerald-400 font-medium">{group.scoring_rules.exact_score} points</span></div>
          <div>Vainqueur correct: <span className="text-emerald-400 font-medium">{group.scoring_rules.correct_winner} points</span></div>
          <div>Match nul correct: <span className="text-emerald-400 font-medium">{group.scoring_rules.correct_draw} points</span></div>
        </div>
      </div>
    </div>
  );
}
