import React from 'react';
import { Clock, Play, CheckCircle, Trophy } from 'lucide-react';
import { Match, Player } from '../types';

interface MatchesViewProps {
  matches?: Match[];
  loadingMatches?: boolean;
  competitionId?: string | number | null;
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

function formatScore(match: Match): { display: string; isLive: boolean; sets?: string[] } {
  if (!match.result) {
    return { display: 'vs', isLive: false };
  }

  // Score en direct
  if (match.result.live_score) {
    const { set, game, point } = match.result.live_score;
    return {
      display: point,
      isLive: true,
      sets: [`Set ${set}`, `Jeu ${game}`],
    };
  }

  // Score final
  if (match.result.score_sets) {
    const sets = match.result.score_sets.p1.map((p1Score, i) => {
      const p2Score = match.result.score_sets!.p2[i];
      return `${p1Score}-${p2Score}`;
    });
    return {
      display: sets.join('  '),
      isLive: false,
      sets,
    };
  }

  return { display: 'vs', isLive: false };
}

export default function MatchesView({ matches = [], loadingMatches, competitionId }: MatchesViewProps) {
  const getStatusIcon = (match: Match) => {
    switch (match.status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4 text-orange-400" />;
      case 'SCHEDULED':
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (match: Match) => {
    switch (match.status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
            TERMINÉ
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
            EN DIRECT
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
            À VENIR
          </span>
        );
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
            {competitionId
              ? "Les matchs de cette compétition n'ont pas encore été programmés ou ne sont pas disponibles dans l'API."
              : "Aucune compétition n'est associée à ce groupe."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                Matchs de la compétition
              </h3>
              <span className="text-slate-400 text-sm">{matches.length} match(s)</span>
            </div>
          </div>

          {matches.map((match) => {
            const scoreData = formatScore(match);
            const isLive = match.status === 'IN_PROGRESS';
            const isCompleted = match.status === 'COMPLETED';

            return (
              <div
                key={match.id}
                className={`relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  isLive
                    ? 'border-orange-500/50 shadow-lg shadow-orange-500/20'
                    : isCompleted
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {isLive && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse" />
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(match)}
                      <span className="text-slate-400 text-sm font-medium">
                        {new Date(match.start_time).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {match.round && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                          {match.round}
                        </span>
                      )}
                      {getStatusBadge(match)}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr,auto,1fr] gap-6 items-center">
                    {/* Joueur 1 */}
                    <div className="text-right space-y-2">
                      <div className="flex items-center justify-end gap-2">
                        <div className={`text-xl font-bold transition-colors ${
                          match.result?.winner_id === match.player1_id
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            : 'text-white'
                        }`}>
                          {getPlayerName(match.player1)}
                        </div>
                        {match.result?.winner_id === match.player1_id && (
                          <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {getPlayerCountry(match.player1) && (
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-medium rounded">
                            {getPlayerCountry(match.player1)}
                          </span>
                        )}
                        {getPlayerRanking(match.player1) && (
                          <span className="px-2 py-0.5 bg-slate-700/30 text-slate-400 text-xs rounded">
                            #{getPlayerRanking(match.player1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-center px-6">
                      <div className="flex flex-col items-center gap-3">
                        {scoreData.isLive && scoreData.sets && (
                          <div className="flex gap-2">
                            {scoreData.sets.map((set, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded border border-orange-500/30"
                              >
                                {set}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className={`text-3xl font-black tracking-wide ${
                          scoreData.isLive
                            ? 'text-orange-400 animate-pulse drop-shadow-[0_0_12px_rgba(251,146,60,0.8)]'
                            : isCompleted
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            : 'text-slate-400'
                        }`}>
                          {scoreData.display}
                        </div>
                        {isCompleted && match.result?.duration && (
                          <span className="text-slate-500 text-xs">
                            Durée: {Math.floor(match.result.duration / 60)}h{match.result.duration % 60}min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Joueur 2 */}
                    <div className="text-left space-y-2">
                      <div className="flex items-center gap-2">
                        {match.result?.winner_id === match.player2_id && (
                          <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                        )}
                        <div className={`text-xl font-bold transition-colors ${
                          match.result?.winner_id === match.player2_id
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            : 'text-white'
                        }`}>
                          {getPlayerName(match.player2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPlayerCountry(match.player2) && (
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-medium rounded">
                            {getPlayerCountry(match.player2)}
                          </span>
                        )}
                        {getPlayerRanking(match.player2) && (
                          <span className="px-2 py-0.5 bg-slate-700/30 text-slate-400 text-xs rounded">
                            #{getPlayerRanking(match.player2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
