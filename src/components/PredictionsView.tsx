import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Play, CheckCircle, Save, Trophy } from 'lucide-react';

import { Match, Prediction, Group, Player } from '../types';
import { predictionService } from '../services/predictionService';

interface PredictionsViewProps {
  group: Group;
  matches?: Match[];
  loadingMatches?: boolean;
}

function getPlayerName(player: string | Player): string {
  return typeof player === 'string' ? player : player.name;
}

function getPlayerCountry(player: string | Player): string | null {
  return typeof player === 'string' ? null : player.country;
}

function getPlayerRanking(player: string | Player): number | null {
  return typeof player === 'string' ? null : player.ranking;
}

export default function PredictionsView({ group, matches: propMatches, loadingMatches }: PredictionsViewProps) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [pendingPredictions, setPendingPredictions] = useState<
    Record<string, { home: number; away: number }>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadPredictions() {
      try {
        if (profile?.id && group.id) {
          const userPredictions = await predictionService.getPredictionsByGroup(group.id);

          // Convert array to Record<string, Prediction>
          const predictionsMap: Record<string, Prediction> = {};
          userPredictions.forEach(pred => {
            predictionsMap[pred.matchId] = pred;
          });

          setPredictions(predictionsMap);
        }
      } catch (error) {
        console.error('Error loading predictions:', error);
        setPredictions({});
      }
    }

    // Use provided matches (no fallback to mock data)
    if (propMatches && propMatches.length > 0) {
      setMatches(propMatches);
    } else {
      setMatches([]);
    }

    loadPredictions();
  }, [group.id, profile?.id, propMatches]);

  async function savePrediction(matchId: number) {
    const pending = pendingPredictions[matchId];
    if (!pending || pending.home < 0 || pending.away < 0) return;

    setLoading((prev) => ({ ...prev, [matchId]: true }));

    try {
      const existingPrediction = predictions[matchId];

      if (existingPrediction) {
        // Update existing prediction
        const updated = await predictionService.updatePrediction(existingPrediction.id, {
          predictedHomeScore: pending.home,
          predictedAwayScore: pending.away,
        });

        setPredictions((prev) => ({
          ...prev,
          [matchId]: updated,
        }));
      } else {
        // Create new prediction
        const created = await predictionService.createPrediction({
          matchId,
          groupId: group.id,
          predictedHomeScore: pending.home,
          predictedAwayScore: pending.away,
        });

        setPredictions((prev) => ({
          ...prev,
          [matchId]: created,
        }));
      }

      setPendingPredictions((prev) => {
        const newPending = { ...prev };
        delete newPending[matchId];
        return newPending;
      });
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Erreur lors de la sauvegarde du pronostic');
    } finally {
      setLoading((prev) => ({ ...prev, [matchId]: false }));
    }
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
      {loadingMatches ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
          <p className="text-slate-400">Chargement des matchs...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Aucun match disponible</h3>
          <p className="text-slate-400">
            {group.competitionId
              ? "Les matchs de cette compétition n'ont pas encore été programmés ou ne sont pas disponibles dans l'API."
              : "Aucune compétition n'est associée à ce groupe."}
          </p>
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
                  <div className="text-white font-semibold text-lg">{getPlayerName(match.player1)}</div>
                  <div className="flex items-center justify-end gap-2 mb-2">
                    {getPlayerCountry(match.player1) && (
                      <span className="text-slate-400 text-sm">{getPlayerCountry(match.player1)}</span>
                    )}
                    {getPlayerRanking(match.player1) && (
                      <span className="text-slate-500 text-xs">#{getPlayerRanking(match.player1)}</span>
                    )}
                  </div>
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
                  <div className="text-white font-semibold text-lg">{getPlayerName(match.player2)}</div>
                  <div className="flex items-center gap-2 mb-2">
                    {getPlayerCountry(match.player2) && (
                      <span className="text-slate-400 text-sm">{getPlayerCountry(match.player2)}</span>
                    )}
                    {getPlayerRanking(match.player2) && (
                      <span className="text-slate-500 text-xs">#{getPlayerRanking(match.player2)}</span>
                    )}
                  </div>
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

      {group.scoringRules && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
          <h3 className="text-white font-semibold mb-2">Règles de points</h3>
          <div className="space-y-1 text-sm text-slate-400">
            {group.scoringRules.exact_score !== undefined && (
              <div>Score exact: <span className="text-emerald-400 font-medium">{group.scoringRules.exact_score} points</span></div>
            )}
            {group.scoringRules.correct_winner !== undefined && (
              <div>Vainqueur correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_winner} points</span></div>
            )}
            {group.scoringRules.correct_draw !== undefined && (
              <div>Match nul correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_draw} points</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}