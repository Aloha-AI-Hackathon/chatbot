import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import './AuthPages.css';

// Create simple placeholder pages for now
const LoginPage = () => (
  <div className="auth-page">
    <h2>Login Page</h2>
    <p>This is a placeholder for the login page.</p>
  </div>
);

const SignupPage = () => (
  <div className="auth-page">
    <h2>Signup Page</h2>
    <p>This is a placeholder for the signup page.</p>
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
};

export default AppRouter; 