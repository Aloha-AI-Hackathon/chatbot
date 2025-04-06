import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { getCurrentUser } from './services/api';

interface User {
  username: string;
  id: string;
  email: string;
}

const AppRouter: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const userData = await getCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <div className="loading-screen">Loading...</div>;
    
    if (!token) {
      return <Navigate to="/login" />;
    }
    
    return <>{children}</>;
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          token ? <Navigate to="/" /> : <LoginPage onAuthSuccess={handleAuthSuccess} />
        } />
        <Route path="/signup" element={
          token ? <Navigate to="/" /> : <SignupPage onAuthSuccess={handleAuthSuccess} />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <App initialToken={token} initialUser={user} />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default AppRouter; 