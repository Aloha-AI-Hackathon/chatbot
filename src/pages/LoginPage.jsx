import React from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from '../components/Auth';
import '../components/Auth.css';
import './AuthPages.css';

const LoginPage = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const handleAuthSuccess = (token) => {
    onAuthSuccess(token);
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-page-container">
        <div className="auth-logo-container">
          <img 
            src="/assets/hawaii-weather-logo.png" 
            alt="KiloKōkua Logo" 
            className="auth-logo" 
          />
          <h1 className="auth-title">KiloKōkua</h1>
          <p className="auth-subtitle">The Hawaiʻi Climate AI Concierge</p>
        </div>
        <Auth onAuthSuccess={handleAuthSuccess} defaultMode="login" />
      </div>
    </div>
  );
};

export default LoginPage; 