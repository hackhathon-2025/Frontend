import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Bienvenue sur PronostiX</h1>
        <p className="text-slate-400 text-lg mb-8">Prédisez, comparez, gagnez entre amis</p>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-lg"
        >
          Accéder au tableau de bord
        </Link>
      </div>
    </div>
  );
}
