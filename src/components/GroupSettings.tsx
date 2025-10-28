import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

import { Group } from '../types';

interface GroupSettingsProps {
  group: Group;
  onUpdate: () => void;
}

export default function GroupSettings({ group, onUpdate }: GroupSettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDeleteGroup() {
    if (deleteConfirmText !== group.name) {
      alert('Le nom du groupe ne correspond pas');
      return;
    }

    setLoading(true);

    try {
      // Simulate deletion
      console.log(`Deleting group ${group.name} (${group.id})`);
      // In a real app, you would call an API here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mt-6">
      <h2 className="text-xl font-bold text-white mb-6">Paramètres du groupe</h2>

      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-semibold text-lg mb-2">Zone de danger</h3>
            <p className="text-slate-300 text-sm mb-4">
              La suppression d'un groupe est définitive. Tous les matchs, pronostics et classements
              seront supprimés de manière permanente.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer le groupe
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tapez le nom du groupe "{group.name}" pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={group.name}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteGroup}
                disabled={loading || deleteConfirmText !== group.name}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}