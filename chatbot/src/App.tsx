import React from 'react';
import { Chat } from './components/Chat';
import './components/Chat.css';
import './App.css';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="App">
      <div className="theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-buttons">
        {user ? (
          <>
            <span className="user-greeting">Hello, {user.username}!</span>
            <button onClick={handleLogout} className="auth-button">Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="auth-button">Log In</Link>
            <Link to="/signup" className="auth-button">Sign Up</Link>
          </>
        )}
      </div>
      <Chat />
    </div>
  );
}

export default App;
