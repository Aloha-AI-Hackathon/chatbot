import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateLeft, faBars } from '@fortawesome/free-solid-svg-icons';
import { sendMessage, checkApiHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from './ChatSidebar';
import ThemeToggle from './ThemeToggle';
import './Chat.css';

interface Message {
    text: string;
    isUser: boolean;
}

interface ChatMessage {
    id: number;
    content: string;
    is_user: boolean;
    created_at: string;
}

export const Chat: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [apiConnected, setApiConnected] = useState<boolean | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load messages for a specific session
    const loadSessionMessages = async (sessionId: string) => {
        if (!sessionId) return;
        
        try {
            const response = await fetch(`http://localhost:8000/sessions/${sessionId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch messages: ${response.statusText}`);
            }

            const chatMessages: ChatMessage[] = await response.json();
            
            // Convert API message format to our local format
            const formattedMessages: Message[] = chatMessages.map(msg => ({
                text: msg.content,
                isUser: msg.is_user
            }));

            setMessages(formattedMessages);
        } catch (err) {
            console.error('Error loading session messages:', err);
            // If we can't load messages, start with an empty chat
            setMessages([]);
        }
    };

    // Check API health on component mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                setApiConnected(null); // Set to connecting state
                const health = await checkApiHealth();
                setApiConnected(health.ai_service_initialized);
                console.log('API health check:', health);
                
                // Add initial bot message if API is connected and no messages yet
                if (health.ai_service_initialized && messages.length === 0 && !sessionId) {
                    setMessages([{
                        text: "Aloha! I'm KiloKōkua, your AI guide to Hawaiʻi's climate. Ask me about weather patterns, climate data, or environmental changes across the islands.",
                        isUser: false
                    }]);
                }
            } catch (error) {
                console.error('API connection failed:', error);
                setApiConnected(false);
                
                // Add fallback message if API is not connected
                if (messages.length === 0 && !sessionId) {
                    setMessages([{
                        text: "Aloha! I'm KiloKōkua, your AI guide to Hawaiʻi's climate. It seems I'm having trouble connecting to my knowledge base at the moment. Please try again shortly.",
                        isUser: false
                    }]);
                }
            }
        };
        
        checkConnection();
        
        // Set up periodic health checks
        const healthCheckInterval = setInterval(() => {
            if (apiConnected === false) {
                console.log('Attempting to reconnect to API...');
                checkConnection();
            }
        }, 30000); // Check every 30 seconds if disconnected
        
        return () => clearInterval(healthCheckInterval);
    }, [apiConnected, sessionId, messages.length]);

    const handleSend = async () => {
        if (inputText.trim()) {
            // Add user message to UI
            const userMessage = { text: inputText, isUser: true };
            setMessages(prev => [...prev, userMessage]);
            
            const userInput = inputText;
            setInputText('');
            setIsThinking(true);

            if (apiConnected) {
                try {
                    // Send message to backend API
                    const response = await sendMessage(userInput, sessionId);
                    
                    // Store session ID for continued conversation
                    setSessionId(response.session_id);
                    
                    // Add bot response
                    setIsThinking(false);
                    
                    // Add the main response
                    setMessages(prev => [...prev, { 
                        text: response.reply,
                        isUser: false 
                    }]);
                    
                    // Trigger a refresh of the sidebar to show the new chat
                    setRefreshTrigger(prev => prev + 1);
                    
                    // If this is the first message and user authentication status is known
                    if (messages.length <= 2) {
                        // Add a note about chat history if user is logged in
                        if (user) {
                            setTimeout(() => {
                                setMessages(prev => [...prev, { 
                                    text: "Your chat history is being saved to your account. You can access it anytime you log in.",
                                    isUser: false 
                                }]);
                            }, 1000);
                        } else {
                            // Suggest logging in to save chat history
                            setTimeout(() => {
                                setMessages(prev => [...prev, { 
                                    text: "Log in or create an account to save your chat history and access it later.",
                                    isUser: false 
                                }]);
                            }, 1000);
                        }
                    }
                } catch (error) {
                    console.error('Error sending message:', error);
                    setIsThinking(false);
                    setMessages(prev => [...prev, { 
                        text: "I'm sorry, I encountered an error processing your request. Please try again later.",
                        isUser: false 
                    }]);
                }
            } else {
                // Fallback for when API is not connected
                setTimeout(() => {
                    setIsThinking(false);
                    setMessages(prev => [...prev, { 
                        text: "I'm currently unable to connect to my knowledge base. Please check your connection to the backend API.",
                        isUser: false 
                    }]);
                }, 1000);
            }
        }
    };

    const suggestions = [
        "What's the average rainfall on the Big Island in February?",
        "How has sea level changed in Honolulu over the past decade?",
        "What are the current climate trends in Maui?"
    ];

    const handleReset = () => {
        setMessages([]);
        setSessionId(null);
    };

    const handleSelectSession = async (id: string) => {
        setSessionId(id);
        await loadSessionMessages(id);
        setShowSidebar(false); // Close sidebar on mobile after selection
    };

    const handleNewChat = () => {
        setSessionId(null);
        setMessages([]);
        setShowSidebar(false); // Close sidebar on mobile after creating new chat
    };

    const handleRetryConnection = async () => {
        try {
            setApiConnected(null); // Set to connecting state
            const health = await checkApiHealth();
            setApiConnected(health.ai_service_initialized);
        } catch (error) {
            setApiConnected(false);
        }
    };

    const closeSidebar = () => {
        setSidebarVisible(false);
    };

    const openSidebar = () => {
        setSidebarVisible(true);
    };

    // Toggle sidebar for mobile view
    const toggleMobileSidebar = () => {
        setShowSidebar(prev => !prev);
    };

    return (
        <div className="app-container">
            <div className={`chat-layout ${showSidebar ? 'show-sidebar' : ''}`}>
                {user && (
                    <div className="sidebar-toggle" onClick={openSidebar} style={{ display: sidebarVisible ? 'none' : 'flex' }}>
                        <FontAwesomeIcon icon={faBars} />
                    </div>
                )}
                
                {user && (
                    <div className={`sidebar-container ${(showSidebar || sidebarVisible) ? 'visible' : ''}`} style={{ display: sidebarVisible ? 'block' : 'none' }}>
                        <ChatSidebar 
                            onSelectSession={handleSelectSession}
                            onNewChat={handleNewChat}
                            currentSessionId={sessionId}
                            refreshTrigger={refreshTrigger}
                            onClose={closeSidebar}
                            visible={sidebarVisible}
                        />
                    </div>
                )}
                
                <div className="chat-container">
                    <div className="chat-theme-toggle">
                        <ThemeToggle />
                    </div>
                    <div className="bot-avatar">
                        <img 
                            src="/assets/hawaii-weather-logo.png" 
                            alt="KiloKōkua Avatar"
                            onError={(e) => {
                                console.error('Error loading logo:', e);
                                e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/hawaii-weather-logo.png`;
                            }}
                        />
                    </div>

                    <div className="bot-name">
                        KiloKōkua
                        <div className="api-status">
                            {apiConnected === null ? (
                                <span className="connecting">Connecting...</span>
                            ) : apiConnected ? (
                                <span className="connected">Connected</span>
                            ) : (
                                <span className="disconnected">Disconnected</span>
                            )}
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="welcome-message">
                                <p>
                                    Aloha! I'm KiloKōkua, your AI guide to Hawaiʻi's climate. 
                                    Ask me about weather patterns, climate data, or environmental 
                                    changes across the islands.
                                </p>
                                <div className="suggestions">
                                    <p>Try asking:</p>
                                    <ul>
                                        {suggestions.map((suggestion, index) => (
                                            <li 
                                                key={index}
                                                onClick={() => setInputText(suggestion)}
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`message-container ${message.isUser ? 'user-message-container' : 'bot-message-container'}`}
                            >
                                <div className="message-label">
                                    {message.isUser ? 'You' : 'KiloKōkua'}
                                </div>
                                <div className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
                                    {message.text}
                                </div>
                            </div>
                        ))}

                        {isThinking && (
                            <div className="message-container bot-message-container">
                                <div className="message-label">KiloKōkua</div>
                                <div className="thinking">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="input-container">
                        <div className="input-wrapper">
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask me about Hawaiʻi's climate..."
                                rows={1}
                                disabled={isThinking || apiConnected === false}
                            />
                            <button 
                                className="icon-button"
                                onClick={handleSend}
                                disabled={inputText.trim() === '' || isThinking || apiConnected === false}
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                            <button 
                                className="icon-button"
                                onClick={handleReset}
                            >
                                <FontAwesomeIcon icon={faRotateLeft} />
                            </button>
                        </div>
                        {apiConnected === false && (
                            <div className="retry-connection">
                                <button onClick={handleRetryConnection}>
                                    Retry connection
                                </button>
                            </div>
                        )}
                        {sessionId && (
                            <div className="session-info">
                                <span>{user ? 'Chat history saved' : 'Active session'}</span>
                            </div>
                        )}
                        <div className="powered-by">
                            <span>"Our data comes from the National Science Foundation & Hawaii EPSCoR. Learn more: <a href="https://www.hawaii.edu/climate-data-portal/">Link to HCDP</a></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
