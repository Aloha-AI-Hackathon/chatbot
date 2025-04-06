<<<<<<< HEAD
import React from 'react';
import { Chat } from './components/Chat';
import './components/Chat.css';

function App() {
  return (
    <div className="App">
      <Chat />
=======
import React, { useState, useRef, useEffect } from 'react';
import InfoModal from './components/InfoModal';
import { sendMessage, checkApiHealth } from './services/api';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Aloha! I'm KiloKōkua, your Hawaiʻi Climate AI Concierge. How can I assist you today with climate information?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Function to check API connection
  const checkApiConnection = async () => {
    setApiConnected(null); // Set to connecting state
    try {
      const health = await checkApiHealth();
      setApiConnected(health.ai_service_initialized);
      console.log('API health check:', health);
      return health.ai_service_initialized;
    } catch (error) {
      console.error('API connection failed:', error);
      setApiConnected(false);
      return false;
    }
  };

  // Check if API is available on component mount
  useEffect(() => {
    checkApiConnection();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      if (apiConnected === false) {
        console.log('Attempting to reconnect to API...');
        checkApiConnection();
      }
    }, 30000); // Check every 30 seconds if disconnected
    
    return () => clearInterval(healthCheckInterval);
  }, [apiConnected]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    try {
      // Send message to backend API
      if (apiConnected) {
        const response = await sendMessage(inputText, sessionId);
        
        // Store session ID for continued conversation
        setSessionId(response.session_id);
        
        // Add bot response
        const botResponse: Message = {
          id: messages.length + 2,
          text: response.reply,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setIsTyping(false);
        setMessages(prev => [...prev, botResponse]);
      } else {
        // Fallback for when API is not connected
        setTimeout(() => {
          const fallbackResponse: Message = {
            id: messages.length + 2,
            text: "I'm currently unable to connect to my knowledge base. Please check your connection to the backend API.",
            sender: 'bot',
            timestamp: new Date()
          };
          setIsTyping(false);
          setMessages(prev => [...prev, fallbackResponse]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    console.log("Dark mode toggled:", newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Force re-render
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // Debug info - remove in production
  useEffect(() => {
    console.log("Current dark mode state:", darkMode);
    console.log("Dark class on HTML:", document.documentElement.classList.contains('dark'));
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-hawaii-blue/20 via-white to-hawaii-teal/20 text-gray-800'}`}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-6 bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-6 items-center">
            {/* Left side - Info button */}
            <div className="col-span-1 flex justify-start">
              <button 
                onClick={() => setInfoModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-hawaii-blue dark:bg-hawaii-coral text-white dark:text-gray-800 hover:bg-hawaii-blue/80 dark:hover:bg-hawaii-coral/80 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-hawaii-teal shadow-md flex items-center space-x-1"
                aria-label="Weather data info"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Info</span>
              </button>
            </div>
            
            {/* Center - Title */}
            <div className="col-span-4 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-hawaii-teal transition-colors duration-300">
                KiloKōkua
              </h1>
              <p className="mt-1 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 transition-colors duration-300">
                The Hawaiʻi Climate AI Concierge
              </p>
            </div>
            
            {/* Right side - Dark mode toggle */}
            <div className="col-span-1 flex justify-end">
              <div className="flex items-center">
                <span className="mr-1 text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </span>
                <label className="inline-flex relative items-center cursor-pointer mx-1">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-hawaii-teal rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-hawaii-teal"></div>
                </label>
                <span className="ml-1 text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto px-4 py-4">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-colors duration-300 ${
                  message.sender === 'user' 
                    ? 'bg-hawaii-teal text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 shadow-md rounded-tl-none'
                }`}
              >
                <p className="text-sm sm:text-base">{message.text}</p>
                <span className="block mt-1 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-md rounded-tl-none max-w-[85%] sm:max-w-[75%] transition-colors duration-300">
                <div className="flex space-x-2 items-center h-6">
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 transition-colors duration-300">
          {/* Session indicator */}
          {sessionId && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Active session
              </span>
              <button 
                onClick={() => setSessionId(null)} 
                className="text-hawaii-teal hover:underline focus:outline-none"
              >
                Reset
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about Hawaiʻi's climate..."
              className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-hawaii-teal dark:text-white transition-colors duration-300"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={inputText.trim() === '' || isTyping}
              className="bg-hawaii-green hover:bg-hawaii-teal text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hawaii-teal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-1 hidden sm:inline">Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          
          {/* API reconnection button */}
          {apiConnected === false && (
            <div className="mt-2 text-center">
              <button
                onClick={() => {
                  checkApiConnection();
                }}
                className="text-sm text-hawaii-teal hover:underline focus:outline-none"
              >
                Retry connection to API
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <p>© 2025 KiloKōkua - The Hawaiʻi Climate AI Concierge</p>
          
          {/* API Connection Status */}
          <div className="flex items-center">
            <span className="mr-2">API:</span>
            {apiConnected === null ? (
              <span className="text-yellow-500 flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1 animate-pulse"></span>
                Connecting...
              </span>
            ) : apiConnected ? (
              <span className="text-green-500 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Connected
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Disconnected
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      <InfoModal 
        isOpen={infoModalOpen} 
        onClose={() => setInfoModalOpen(false)} 
      />
>>>>>>> ecb2885 (API connected to llm)
    </div>
  );
}

export default App;
