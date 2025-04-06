import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { sendMessage, checkApiHealth, getCurrentUser, getUserSessions, getSession, deleteSession } from './services/api';

interface User {
  username: string;
  id: string;
  email: string;
}

interface Message {
  content: string;
  isUser: boolean;
}

interface Session {
  id: string;
  title?: string;
  created_at: string;
  last_message_at: string;
}

interface AppProps {
  initialToken: string | null;
  initialUser: User | null;
}

function App({ initialToken, initialUser }: AppProps) {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<User | null>(initialUser);
  const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check API connection on component mount
  useEffect(() => {
    checkApiConnection();
    
    // Set up periodic health check every 30 seconds
    const healthCheckInterval = setInterval(() => {
      checkApiConnection();
    }, 30000);
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Load user data if token exists but user is not set
  useEffect(() => {
    if (token && !user) {
      loadUserData();
    }
  }, [token, user]);

  // Load sessions when user is available
  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserData = async () => {
    try {
      const userData = await getCurrentUser(token);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      handleLogout();
    }
  };

  const loadUserSessions = async () => {
    try {
      const sessions = await getUserSessions(token);
      setUserSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const checkApiConnection = async () => {
    setApiConnected(null); // Set to null to indicate "connecting" state
    try {
      const health = await checkApiHealth();
      console.log('API health check result:', health);
      setApiConnected(health.status === 'healthy' && health.ai_service_initialized);
    } catch (error) {
      console.error('API connection check failed:', error);
      setApiConnected(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    // Add user message to chat
    const userMessage = { content: input, isUser: true };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      if (!apiConnected) {
        await checkApiConnection();
      }
      
      if (apiConnected) {
        // Send message to API
        const response = await sendMessage(input, sessionId, token);
        
        // Add response to messages
        const botMessage = { content: response.reply, isUser: false };
        setMessages(prev => [...prev, botMessage]);
        
        // Update session ID if new
        if (sessionId !== response.session_id) {
          setSessionId(response.session_id);
          
          // Reload sessions list if user is authenticated
          if (token) {
            loadUserSessions();
          }
        }
      } else {
        // Fallback message if API is not connected
        setTimeout(() => {
          const fallbackMessage = { 
            content: "I'm unable to connect to the AI service. Please check your connection or try again later.", 
            isUser: false 
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        content: `Error: ${error.message}`, 
        isUser: false 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUserSessions([]);
    navigate('/login');
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      // Get session data
      const session = await getSession(sessionId, token);
      
      // Load messages
      setSessionId(sessionId);
      setShowSessions(false);
      
      // Clear current messages and load from session
      if (session.messages && session.messages.length > 0) {
        const formattedMessages = session.messages.map(msg => ({
          content: msg.content,
          isUser: msg.is_user
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    try {
      await deleteSession(sessionId, token);
      
      // Remove from userSessions list
      setUserSessions(userSessions.filter(session => session.id !== sessionId));
      
      // If the current session was deleted, reset
      if (sessionId === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setShowSessions(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>KiloKōkua – The Hawaiʻi Climate AI Concierge</h1>
        <div className="user-controls">
          {user && (
            <>
              <span className="user-greeting">Aloha, {user.username}!</span>
              <button 
                onClick={() => setShowSessions(!showSessions)} 
                className="session-button"
              >
                {showSessions ? 'Hide Sessions' : 'Show Sessions'}
              </button>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          )}
        </div>
      </header>

      <div className="chat-container">
        {showSessions && (
          <div className="sessions-sidebar">
            <h2>Your Conversations</h2>
            <button onClick={handleNewChat} className="new-chat-button">
              + New Conversation
            </button>
            
            <div className="sessions-list">
              {userSessions.length === 0 ? (
                <p>No conversations yet. Start chatting!</p>
              ) : (
                userSessions.map(session => (
                  <div 
                    key={session.id} 
                    className={`session-item ${session.id === sessionId ? 'active' : ''}`}
                    onClick={() => handleSessionSelect(session.id)}
                  >
                    <div className="session-title">
                      {session.title || `Conversation ${new Date(session.created_at).toLocaleDateString()}`}
                    </div>
                    <div className="session-date">
                      {new Date(session.last_message_at).toLocaleString()}
                    </div>
                    <button 
                      className="delete-session-button"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className={`chat-area ${showSessions ? 'with-sidebar' : ''}`}>
          <div className="messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Welcome to KiloKōkua!</h2>
                <p>I'm your friendly Climate AI Concierge for Hawaiʻi.</p>
                <p>How can I help you today?</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.isUser ? 'user' : 'bot'}`}>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="message bot">
                <div className="message-content typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            {sessionId && (
              <div className="session-indicator">
                <span className="session-active">
                  <span className="session-dot"></span>
                  Active session
                </span>
                <button 
                  className="reset-session"
                  onClick={handleNewChat}
                >
                  Reset
                </button>
              </div>
            )}
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isTyping}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      <footer className="App-footer">
        <div>© 2023 KiloKōkua – The Hawaiʻi Climate AI Concierge</div>
        
        <div className="api-status">
          API: 
          {apiConnected === null && (
            <span className="connecting">
              <span className="status-dot connecting"></span>
              Connecting...
            </span>
          )}
          {apiConnected === true && (
            <span className="connected">
              <span className="status-dot connected"></span>
              Connected
            </span>
          )}
          {apiConnected === false && (
            <span className="disconnected">
              <span className="status-dot disconnected"></span>
              Disconnected
              <button 
                onClick={checkApiConnection}
                className="reconnect-button"
              >
                Retry
              </button>
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App; 