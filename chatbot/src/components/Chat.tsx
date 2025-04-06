import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateLeft, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { sendMessage, checkApiHealth } from '../services/api';
import './Chat.css';

interface Message {
    text: string;
    isUser: boolean;
}

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [apiConnected, setApiConnected] = useState<boolean | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check API health on component mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                setApiConnected(null); // Set to connecting state
                const health = await checkApiHealth();
                setApiConnected(health.ai_service_initialized);
                console.log('API health check:', health);
            } catch (error) {
                console.error('API connection failed:', error);
                setApiConnected(false);
                
                // Add fallback message if API is not connected
                if (messages.length === 0) {
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
    }, [apiConnected]);

    useEffect(() => {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        // Update theme in localStorage and document
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

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
                    setMessages(prev => [...prev, { 
                        text: response.reply,
                        isUser: false 
                    }]);
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

    const handleRetryConnection = async () => {
        try {
            setApiConnected(null); // Set to connecting state
            const health = await checkApiHealth();
            setApiConnected(health.ai_service_initialized);
        } catch (error) {
            setApiConnected(false);
        }
    };

    return (
        <div className="app-container">
            <div className="chat-container">
                <button className="theme-toggle" onClick={toggleTheme}>
                    <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
                </button>
                
                <div className="bot-avatar">
                    <img src={process.env.PUBLIC_URL + '/assets/hawaii-weather-logo.png'} alt="KiloKōkua Avatar" />
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
                            <span>Active session</span>
                        </div>
                    )}
                    <div className="powered-by">
                        <span>Powered by AI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}; 