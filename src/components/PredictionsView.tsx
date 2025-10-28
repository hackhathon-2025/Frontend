import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Clock, Play, CheckCircle, Trophy, Edit } from "lucide-react";

import { Match, Prediction, Group, Player } from "../types";
import { predictionService } from "../services/predictionService";
import PredictionModal from "./PredictionModal";

interface PredictionsViewProps {
  group: Group;
  matches?: Match[];
  loadingMatches?: boolean;
}

function getPlayerName(player: string | Player): string {
  return typeof player === "string" ? player : player.name;
}

function getPlayerId(player: string | Player): number {
  return typeof player === "string" ? 0 : player.id;
}

function getPredictedWinnerName(prediction: Prediction, match: Match): string {
  if (prediction.winnerId === getPlayerId(match.player1)) {
    return getPlayerName(match.player1);
  }
  if (prediction.winnerId === getPlayerId(match.player2)) {
    return getPlayerName(match.player2);
  }
  return "N/A";
}

function formatScore(match: Match): string {
  if (!match.result) {
    return "vs";
  }

  if (match.result.live_score) {
    return `Set ${match.result.live_score.set} - Game ${match.result.live_score.game} - ${match.result.live_score.point}`;
  } else if (match.result.score_sets) {
    return match.result.score_sets.p1.map((s: number, i: number) => `${s}-${match.result.score_sets.p2[i]}`).join(", ");
  }
  return "vs";
}

export default function PredictionsView({ group, matches: propMatches, loadingMatches }: PredictionsViewProps) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loadingPredictions, setLoadingPredictions] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const loadPredictions = async () => {
    try {
      if (profile?.id && group.id) {
        const userPredictions = await predictionService.getPredictionsByGroup(group.id);
        const predictionsMap: Record<string, Prediction> = {};
        userPredictions.forEach((pred) => {
          predictionsMap[pred.matchId] = pred;
        });
        setPredictions(predictionsMap);
      }
    } catch (error) {
      console.error("Error loading predictions:", error);
      setPredictions({});
    } finally {
      setLoadingPredictions(false);
    }
  };

  useEffect(() => {
    if (propMatches) {
      setMatches(propMatches);
    }
    loadPredictions();
  }, [group.id, profile?.id, propMatches]);

  const openPredictionModal = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const closePredictionModal = () => {
    setSelectedMatch(null);
    setIsModalOpen(false);
  };

  const handlePredictionSubmit = () => {
    loadPredictions();
  };

  const getStatusIcon = (match: Match) => {
    switch (match.status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4 text-orange-400" />;
      case "SCHEDULED":
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (match: Match) => {
    switch (match.status) {
      case "COMPLETED":
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">TERMINÉ</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">EN DIRECT</span>;
      case "SCHEDULED":
      default:
        return <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">À VENIR</span>;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {loadingMatches || loadingPredictions ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
            <p className="text-slate-400">Chargement des pronostics...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12 text-center">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Aucun match disponible</h3>
            <p className="text-slate-400">{group.competitionId ? "Les matchs de cette compétition n'ont pas encore été programmés." : "Aucune compétition n'est associée à ce groupe."}</p>
          </div>
        ) : (
          matches.map((match) => {
            const prediction = predictions[match.id];

            return (
              <div key={match.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(match)}
                    <span className="text-slate-400 text-sm">{new Date(match.start_time).toLocaleString("fr-FR")}</span>
                    {getStatusBadge(match)}
                  </div>
                  {prediction && match.status === "SCHEDULED" && (
                    <div className="text-sm text-slate-400">
                      Votre pronostic : <span className="font-bold text-white">{getPredictedWinnerName(prediction, match)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
                  <div className="text-center font-semibold text-lg text-white">{getPlayerName(match.player1)}</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatScore(match)}</div>
                  <div className="text-center font-semibold text-lg text-white">{getPlayerName(match.player2)}</div>
                </div>

                <div className="flex justify-end items-center pt-4 border-t border-slate-700">
                  {match.status === "COMPLETED" && prediction && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                        <Trophy className="w-4 h-4" />+{prediction.pointsEarned} pts
                      </div>
                    </div>
                  )}
                  {match.status === "COMPLETED" && !prediction && <div className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-sm">Match terminé sans pronostic</div>}
                  {match.status === "SCHEDULED" && (
                    <button
                      onClick={() => openPredictionModal(match)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      {prediction ? "Modifier le pronostic" : "Faire un pronostic"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {group.scoringRules && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 mt-4">
            <h3 className="text-white font-semibold mb-2">Règles de points</h3>
            <div className="space-y-1 text-sm text-slate-400">
              {group.scoringRules.exact_score !== undefined && (
                <div>
                  Score exact: <span className="text-emerald-400 font-medium">{group.scoringRules.exact_score} points</span>
                </div>
              )}
              {group.scoringRules.correct_winner !== undefined && (
                <div>
                  Vainqueur correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_winner} points</span>
                </div>
              )}
              {group.scoringRules.correct_draw !== undefined && (
                <div>
                  Match nul correct: <span className="text-emerald-400 font-medium">{group.scoringRules.correct_draw} points</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && selectedMatch && (
        <PredictionModal match={selectedMatch} group={group} prediction={predictions[selectedMatch.id]} onClose={closePredictionModal} onPredictionSubmit={handlePredictionSubmit} />
      )}
    </>
  );
}
