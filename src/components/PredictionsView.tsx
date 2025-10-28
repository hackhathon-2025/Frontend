import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Play, CheckCircle, Save, Trophy } from 'lucide-react';

import { Match, Prediction, Group } from '../types';

const mockMatches: Match[] = [
  {
    id: 1,
    competition_id: 1,
    player1_id: 1,
    player2_id: 2,
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    round: 'Finale',
    status: 'scheduled',
    player1: 'Carlos Alcaraz',
    player2: 'Novak Djokovic',
    score: null,
  },
  {
    id: 2,
    competition_id: 1,
    player1_id: 3,
    player2_id: 4,
    start_time: new Date().toISOString(),
    round: 'Demi-Finale',
    status: 'live',
    player1: 'Jannik Sinner',
    player2: 'Daniil Medvedev',
    score: '1-1',
  },
  {
    id: 3,
    competition_id: 1,
    player1_id: 5,
    player2_id: 6,
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    round: 'Quart de Finale',
    status: 'finished',
    player1: 'Alexander Zverev',
    player2: 'Stefanos Tsitsipas',
    score: '2-0',
  },
];

const mockPredictions: Record<string, Prediction> = {
    '3': {
        id: 'pred1',
        userId: '1',
        groupId: '1',
        matchId: '3',
        winner: 'Alexander Zverev',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        pointsEarned: 5,
    },
};

export default function PredictionsView({ group }: { group: Group }) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pendingPredictions, setPendingPredictions] = useState<
    Record<string, { home: number; away: number }>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMatches(mockMatches);
    setPredictions(mockPredictions);
  }, [group.id, profile?.id]);

  async function savePrediction(matchId: number) {
    const pending = pendingPredictions[matchId];
    if (!pending || pending.home < 0 || pending.away < 0) return;

    setLoading((prev) => ({ ...prev, [matchId]: true }));

    const newPrediction: Prediction = {
        id: `pred-${matchId}-${profile?.id}`,
        userId: profile?.id || '1',
        groupId: group.id,
        matchId: matchId.toString(),
        winner: '', // This would be determined by the backend based on predicted scores
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        predictedHomeScore: pending.home,
        predictedAwayScore: pending.away,
        pointsEarned: 0, // This would be calculated on the backend
    };

    setPredictions((prev) => ({
        ...prev,
        [matchId]: newPrediction,
    }));

    setPendingPredictions((prev) => {
        const newPending = { ...prev };
        delete newPending[matchId];
        return newPending;
    });

    setLoading((prev) => ({ ...prev, [matchId]: false }));
  }

  function updatePrediction(matchId: number, field: 'home' | 'away', value: number) {
    setPendingPredictions((prev) => ({
      ...prev,
      [matchId]: {
        home: field === 'home' ? value : prev[matchId]?.home ?? predictions[matchId]?.predictedHomeScore ?? 0,
        away: field === 'away' ? value : prev[matchId]?.away ?? predictions[matchId]?.predictedAwayScore ?? 0,
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
            +{prediction.pointsEarned} pts
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

    if (pending || (!prediction && new Date(match.start_time) > new Date())) {
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

  const getStatusIcon = (match: Match) => {
    if (match.status === 'finished') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    } else if (new Date(match.start_time) < new Date()) {
      return <Play className="w-4 h-4 text-orange-400" />;
    } else {
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
          const isPastMatch = new Date(match.start_time) < new Date();

          return (
            <div
              key={match.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(match)}
                <span className="text-slate-400 text-sm">
                  {new Date(match.start_time).toLocaleString('fr-FR')}
                </span>
                {new Date(match.start_time) < new Date() && match.status !== 'finished' && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                    EN DIRECT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
                <div className="text-right">
                  <div className="text-white font-semibold text-lg mb-2">{match.player1}</div>
                  {!isPastMatch ? (
                    <input
                      type="number"
                      min="0"
                      value={
                        pending?.home ??
                        prediction?.predictedHomeScore ??
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
                      Pronostic: {prediction?.predictedHomeScore ?? '-'}
                    </div>
                  )}
                </div>

                <div className="text-center">
                  {match.score !== null ? (
                    <div className="text-2xl font-bold text-emerald-400">
                      {match.score}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-600">vs</div>
                  )}
                </div>

                <div className="text-left">
                  <div className="text-white font-semibold text-lg mb-2">{match.player2}</div>
                  {!isPastMatch ? (
                    <input
                      type="number"
                      min="0"
                      value={
                        pending?.away ??
                        prediction?.predictedAwayScore ??
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
                      Pronostic: {prediction?.predictedAwayScore ?? '-'}
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
          <div>Score exact: <span className="text-emerald-400 font-medium">{group.scoringRules.exact_score} points</span></div>
          <div>Vainqueur correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_winner} points</span></div>
          <div>Match nul correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_draw} points</span></div>
        </div>
      </div>
    </div>
  );
}