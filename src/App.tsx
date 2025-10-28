import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Home from './pages/Home';
import GroupDetail from './pages/GroupDetail';
import CreateGroup from './pages/CreateGroup';

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <ProtectedRoute>
            <GroupDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-group"
        element={
          <ProtectedRoute>
            <CreateGroup onClose={() => navigate('/dashboard')} onGroupCreated={() => navigate('/dashboard')} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;