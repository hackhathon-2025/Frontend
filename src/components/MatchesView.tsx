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

export default function MatchesView({ matches = [], loadingMatches, competitionId }: MatchesViewProps) {
  const getStatusIcon = (match: Match) => {
    if (match.status === 'Finished' || match.status === 'finished') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    } else if (new Date(match.start_time) < new Date()) {
      return <Play className="w-4 h-4 text-orange-400" />;
    } else {
      return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (match: Match) => {
    if (match.status === 'Finished' || match.status === 'finished') {
      return (
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
          TERMINÉ
        </span>
      );
    } else if (new Date(match.start_time) < new Date() && match.status !== 'Finished') {
      return (
        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
          EN DIRECT
        </span>
      );
    } else {
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

          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(match)}
                  <span className="text-slate-400 text-sm">
                    {new Date(match.start_time).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {getStatusBadge(match)}
              </div>

              {match.round && (
                <div className="mb-3">
                  <span className="text-emerald-400 text-sm font-medium">{match.round}</span>
                </div>
              )}

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                <div className="text-right">
                  <div className="text-white font-semibold text-lg">{getPlayerName(match.player1)}</div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    {getPlayerCountry(match.player1) && (
                      <span className="text-slate-400 text-sm">{getPlayerCountry(match.player1)}</span>
                    )}
                    {getPlayerRanking(match.player1) && (
                      <span className="text-slate-500 text-xs">#{getPlayerRanking(match.player1)}</span>
                    )}
                  </div>
                </div>

                <div className="text-center px-4">
                  {match.score !== null && match.score !== undefined ? (
                    <div className="text-2xl font-bold text-emerald-400">{match.score}</div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-600">vs</div>
                  )}
                </div>

                <div className="text-left">
                  <div className="text-white font-semibold text-lg">{getPlayerName(match.player2)}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getPlayerCountry(match.player2) && (
                      <span className="text-slate-400 text-sm">{getPlayerCountry(match.player2)}</span>
                    )}
                    {getPlayerRanking(match.player2) && (
                      <span className="text-slate-500 text-xs">#{getPlayerRanking(match.player2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
