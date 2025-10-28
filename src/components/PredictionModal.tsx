import React, { useState, useEffect } from 'react';
import { Match, Group, Player, Prediction } from '../types';
import { predictionService, CreatePredictionData, UpdatePredictionData } from '../services/predictionService';
import { X, Trophy } from 'lucide-react';

interface PredictionModalProps {
  match: Match;
  group: Group;
  prediction?: Prediction | null;
  onClose: () => void;
  onPredictionSubmit: () => void;
}

function getPlayerName(player: string | Player): string {
    return typeof player === 'string' ? player : player.name;
}

function getPlayerId(player: string | Player): number {
    return typeof player === 'string' ? 0 : player.id;
}

export default function PredictionModal({ match, group, prediction, onClose, onPredictionSubmit }: PredictionModalProps) {
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prediction) {
      setSelectedWinnerId(prediction.winnerId);
    }
  }, [prediction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedWinnerId === null) {
      setError('Veuillez sélectionner un vainqueur.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (prediction) {
        const predictionData: UpdatePredictionData = {
          winnerId: selectedWinnerId,
        };
        await predictionService.updatePrediction(prediction.id, predictionData);
      } else {
        const predictionData: CreatePredictionData = {
          matchId: match.id,
          groupId: group.id,
          winnerId: selectedWinnerId,
        };
        await predictionService.createPrediction(predictionData);
      }
      onPredictionSubmit();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdate = !!prediction;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{isUpdate ? 'Modifier' : 'Faire'} un pronostic</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 text-center">
            <div className="text-lg text-slate-300">{match.round}</div>
            <div className="text-sm text-slate-400">{new Date(match.start_time).toLocaleString('fr-FR')}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <button type="button" onClick={() => setSelectedWinnerId(getPlayerId(match.player1))} className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedWinnerId === getPlayerId(match.player1) ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg text-white">{getPlayerName(match.player1)}</span>
                    {selectedWinnerId === getPlayerId(match.player1) && <Trophy className="w-5 h-5 text-emerald-400" />}
                </div>
            </button>
            <button type="button" onClick={() => setSelectedWinnerId(getPlayerId(match.player2))} className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedWinnerId === getPlayerId(match.player2) ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg text-white">{getPlayerName(match.player2)}</span>
                    {selectedWinnerId === getPlayerId(match.player2) && <Trophy className="w-5 h-5 text-emerald-400" />}
                </div>
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            disabled={isSubmitting || selectedWinnerId === null}
          >
            {isSubmitting ? 'Envoi en cours...' : (isUpdate ? 'Modifier le pronostic' : 'Valider le pronostic')}
          </button>
        </form>
      </div>
    </div>
  );
}
