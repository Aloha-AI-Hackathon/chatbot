import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import './Chat.css';

interface Message {
    text: string;
    isUser: boolean;
}

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (inputText.trim()) {
            setMessages([...messages, { text: inputText, isUser: true }]);
            setInputText('');
            setIsThinking(true);

            // Simulate bot response
            setTimeout(() => {
                setIsThinking(false);
                setMessages(prev => [...prev, { 
                    text: "I'm processing your request about Hawaii's climate...",
                    isUser: false 
                }]);
            }, 1000);
        }
    };

    const suggestions = [
        "What's the average rainfall on the Big Island in February?",
        "How has sea level changed in Honolulu over the past decade?",
        "What are the current climate trends in Maui?"
    ];

    const handleReset = () => {
        setMessages([]);
        setInputText('');
    };

    return (
        <div className="app-container">
            <div className="chat-container">
                <div className="bot-avatar">
                    <img src={process.env.PUBLIC_URL + '/assets/hawaii-weather-logo.png'} alt="KiloKōkua Avatar" />
                </div>

                <div className="bot-name">KiloKōkua</div>

                <div className="chat-messages">
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
                        />
                        <button 
                            className="icon-button"
                            onClick={handleSend}
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
                    <div className="powered-by">
                        <span>Powered by AI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}; 