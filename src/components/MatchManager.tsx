import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Play, CheckCircle } from 'lucide-react';

import { Match, Group } from '../types';

interface MatchManagerProps {
  group: Group;
  isOwner: boolean;
  isAdmin: boolean;
}

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

export default function MatchManager({ group, isOwner, isAdmin }: MatchManagerProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [score, setScore] = useState<string | null>(null);
  const [status, setStatus] = useState<'scheduled' | 'live' | 'finished'>('scheduled');
  const [round, setRound] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMatches(mockMatches);
  }, [group.id]);

  function resetForm() {
    setPlayer1('');
    setPlayer2('');
    setScheduledAt('');
    setScore(null);
    setStatus('scheduled');
    setRound('');
    setEditingMatch(null);
    setShowForm(false);
  }

  function startEdit(match: Match) {
    setEditingMatch(match);
    setPlayer1(match.player1);
    setPlayer2(match.player2);
    setScheduledAt(match.start_time.substring(0, 16));
    setScore(match.score);
    setStatus(match.status as any);
    setRound(match.round);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const matchData: Match = {
      id: editingMatch ? editingMatch.id : new Date().getTime(),
      competition_id: 1, // Replace with actual competition id
      player1_id: 1, // Replace with actual player id
      player2_id: 2, // Replace with actual player id
      player1,
      player2,
      start_time: scheduledAt,
      score,
      status,
      round,
    };

    if (editingMatch) {
      setMatches(matches.map((m) => (m.id === editingMatch.id ? matchData : m)));
    } else {
      setMatches([...matches, matchData]);
    }

    resetForm();
    setLoading(false);
  }

  async function deleteMatch(matchId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) return;
    setMatches(matches.filter((m) => m.id !== matchId));
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'finished':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-slate-700/50 text-slate-400 border-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-4 h-4" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOwner && !isAdmin) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Gestion des matchs</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un match
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900/30 rounded-lg p-4 mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingMatch ? 'Modifier le match' : 'Nouveau match'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Joueur 1 *</label>
              <input
                type="text"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Novak Djokovic"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Joueur 2 *</label>
              <input
                type="text"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Carlos Alcaraz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date et heure *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Round</label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Finale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="scheduled">Programmé</option>
                <option value="live">En cours</option>
                <option value="finished">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Score</label>
              <input
                type="text"
                value={score ?? ''}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="6-4 6-4"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : editingMatch ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {matches.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Aucun match programmé</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusColor(
                      match.status
                    )}`}
                  >
                    {getStatusIcon(match.status)}
                    {match.status === 'live' ? 'En cours' : match.status === 'finished' ? 'Terminé' : 'Programmé'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {new Date(match.start_time).toLocaleString('fr-FR')}
                  </span>
                  <span className="text-slate-400 text-sm">{match.round}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">{match.player1}</span>
                  <span className="text-emerald-400 font-bold">
                    {match.score ?? 'vs'}
                  </span>
                  <span className="text-white font-medium">{match.player2}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(match)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => deleteMatch(match.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}