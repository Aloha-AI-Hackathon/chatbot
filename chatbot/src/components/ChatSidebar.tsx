import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faComments, faPencilAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './ChatSidebar.css';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

interface ChatSidebarProps {
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
  refreshTrigger: number;
  onClose: () => void;
  visible: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  onSelectSession, 
  onNewChat, 
  currentSessionId,
  refreshTrigger,
  onClose,
  visible
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) {
        setSessions([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8000/sessions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.statusText}`);
        }

        const data = await response.json();
        setSessions(data);
      } catch (err) {
        console.error('Error fetching chat sessions:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, refreshTrigger]);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      // Remove the deleted session from the list
      setSessions(sessions.filter(session => session.id !== sessionId));
      
      // If the current session was deleted, create a new one
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error('Error deleting chat session:', err);
      alert('Failed to delete chat');
    }
  };

  const startEditingSession = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle || 'New Chat');
  };

  const saveSessionTitle = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`http://localhost:8000/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title: editingTitle })
      });

      if (!response.ok) {
        throw new Error(`Failed to update session title: ${response.statusText}`);
      }

      // Update the session title in the local state
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, title: editingTitle } 
          : session
      ));
      
      setEditingSessionId(null);
    } catch (err) {
      console.error('Error updating chat session title:', err);
      alert('Failed to update chat title');
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get the first few characters of the first message as a title if no title is set
  const getSessionTitle = (session: ChatSession) => {
    return session.title || 'New Chat';
  };

  if (!user) {
    return null; // Don't show sidebar for non-authenticated users
  }

  if (!visible) {
    return null; // Don't render if not visible
  }

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>Chat History</h2>
        <div className="sidebar-actions">
          <button className="new-chat-button" onClick={onNewChat} title="New Chat">
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button className="close-sidebar-button" onClick={onClose} title="Close Sidebar">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-sessions">Loading chats...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="no-sessions">
          <p>No chat history yet</p>
        </div>
      ) : (
        <ul className="sessions-list">
          {sessions.map(session => (
            <li 
              key={session.id} 
              className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              {editingSessionId === session.id ? (
                <div className="session-edit">
                  <input 
                    type="text" 
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button 
                      onClick={(e) => saveSessionTitle(session.id, e)}
                      title="Save"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button 
                      onClick={cancelEditing}
                      title="Cancel"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="session-info">
                    <div className="session-title">{getSessionTitle(session)}</div>
                    <div className="session-date">{formatDate(session.last_message_at)}</div>
                  </div>
                  <div className="session-actions">
                    <button 
                      className="edit-session-button"
                      onClick={(e) => startEditingSession(session.id, getSessionTitle(session), e)}
                      title="Edit chat name"
                    >
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                    <button 
                      className="delete-session-button"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      title="Delete chat"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatSidebar;
