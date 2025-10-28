import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Account() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Mon Compte</h2>
              <p className="text-slate-400 text-sm">Gérez les informations de votre profil</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom d'utilisateur</label>
              <p className="text-white text-lg">{profile?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <p className="text-white text-lg">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
