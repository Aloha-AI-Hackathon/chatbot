import React from 'react';
import { Chat } from './components/Chat';
import './components/Chat.css';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <div className="auth-buttons">
        <Link to="/login" className="auth-button">Log In</Link>
        <Link to="/signup" className="auth-button">Sign Up</Link>
      </div>
      <Chat />
    </div>
  );
}

export default App;
