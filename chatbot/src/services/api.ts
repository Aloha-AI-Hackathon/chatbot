// API Types
interface ChatRequest {
  message: string;
  session_id: string | null;
}

interface ChatResponse {
  reply: string;
  session_id: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  content: string;
  is_user: boolean;
  created_at: string;
  chat_session_id: string;
  message_metadata?: any;
}

export interface User {
  username: string;
  email: string;
  id: number;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('token');
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

/**
 * Send a message to the KiloKōkua backend API
 */
export const sendMessage = async (message: string, sessionId: string | null = null): Promise<ChatResponse> => {
  try {
    // Ensure message is a string and not empty
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }
    
    // Always send empty string instead of null to avoid backend validation errors
    let session_id = '';
    if (sessionId && sessionId !== 'null' && sessionId !== 'undefined' && sessionId !== 'string') {
      session_id = sessionId;
    }
    
    const requestBody = { 
      message, 
      session_id 
    };
    
    console.log('Sending request to API:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        errorDetails = await response.text();
      }
      
      console.error(`API error (${response.status}): ${errorDetails}`);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('API response:', responseData);
    return responseData;
  } catch (error) {
    console.error('Failed to send message to API:', error);
    throw error;
  }
};

/**
 * Check the health of the KiloKōkua backend API
 */
export const checkApiHealth = async (): Promise<{status: string; ai_service_initialized: boolean}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    const healthData = await response.json();
    console.log('API health check response:', healthData);
    return healthData;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Login with username and password
 */
export const login = async (credentials: LoginCredentials): Promise<Token> => {
  try {
    // Convert credentials to form data format required by OAuth2
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const tokenData = await response.json();
    // Store the token in localStorage
    setToken(tokenData.access_token);
    return tokenData;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Register a new user
 */
export const signup = async (userData: SignupData): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Get the current user's information
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid or expired
        removeToken();
        return null;
      }
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Logout the current user
 */
export const logout = (): void => {
  removeToken();
};

/**
 * Get all chat sessions for the current user
 */
export const getChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat sessions: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    throw error;
  }
};

/**
 * Get a specific chat session by ID
 */
export const getChatSession = async (sessionId: string): Promise<ChatSession> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to get chat session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get messages for a specific chat session
 */
export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat messages: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to get messages for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat session: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete chat session ${sessionId}:`, error);
    throw error;
  }
};
