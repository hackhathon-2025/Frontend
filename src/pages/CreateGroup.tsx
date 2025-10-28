import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Users, Target } from 'lucide-react';
import { Group } from '../types';

interface CreateGroupProps {
  onClose: () => void;
  onGroupCreated: (newGroup: Group) => void;
}

export default function CreateGroup({ onClose, onGroupCreated }: CreateGroupProps) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [competitionListName, setCompetitionListName] = useState();
  // const [competitionType, setCompetitionType] = useState('');
  const [competitionName, setCompetitionName] = useState('');
  // const [exactScore, setExactScore] = useState(5);
  // const [correctWinner, setCorrectWinner] = useState(3);
  // const [correctDraw, setCorrectDraw] = useState(2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComp = async () => {
      try {
        const resCompName = await fetch("http://localhost:3000/api/competitions");
        const myCompData = await resCompName.json();

        setCompetitionListName(myCompData);
      } catch (error) {
        console.error("Erreur lors du chargement des groupes :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComp();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const newGroup: Group = {
      id: new Date().toISOString(),
      name: name,
      description: description || null,
      ownerId: profile?.id || '1',
      isPublic: isPublic,
      competitionName: competitionName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      memberCount: 1,
    };

    onGroupCreated(newGroup);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Créer un groupe</h2>
              <p className="text-slate-400 text-sm">Configurez votre compétition de pronostics</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du groupe *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Pronostics Euro 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Description du groupe..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom de la compétition *
              </label>
              <select
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Sélectionner un Nom</option>
                {competitionListName.map((name) => (
                  <option key={name.name} value={name.id}>
                    {name.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-900/30 rounded-lg">
              <input
                type="checkbox"
                id="is-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
              <label htmlFor="is-public" className="text-slate-300 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Groupe public (visible par tous)</span>
              </label>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Règles de points</h3>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer le groupe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}