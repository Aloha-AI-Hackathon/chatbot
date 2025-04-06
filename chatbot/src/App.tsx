import React from 'react';
import { Chat } from './components/Chat';
import './components/Chat.css';
import './App.css';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

function App() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="App">
      <div className="theme-toggle">
        <button onClick={toggleTheme} className="theme-button">
          <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
        </button>
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
