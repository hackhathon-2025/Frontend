import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, LogIn } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">PronostiX</h1>
          <p className="text-slate-400">Prédisez, comparez, gagnez entre amis</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            !isSignUp
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isSignUp
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Votre pseudo"
              required={isSignUp}
            />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
              </label>
              <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="vous@exemple.com"
            required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Mot de passe
              </label>
              <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="••••••••"
            required
            minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
            </button>

            <button
              type="button"
              onClick={async () => {
            setEmail('test@example.com');
            setPassword('password123');
            setError('');
            setLoading(true);
            try {
              await signIn('test@example.com', 'password123');
            } catch (err: any) {
              setError(err.message || 'An error occurred');
            } finally {
              setLoading(false);
            }
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
            >
              Connexion automatique
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Rejoignez des groupes, faites vos pronostics et défiez vos amis
        </p>
      </div>
    </div>
  );
}
