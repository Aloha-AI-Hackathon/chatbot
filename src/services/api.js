// API Service for KiloKōkua
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to get the error message from the response
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || `Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// Authentication functions
export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    credentials: 'include',
  });

  return handleResponse(response);
};

export const register = async (username, email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  return handleResponse(response);
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

// Session management functions
export const getUserSessions = async (token) => {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

export const getSession = async (sessionId, token = null) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    headers,
  });

  return handleResponse(response);
};

export const deleteSession = async (sessionId, token = null) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse(response);
};

export const getSessionMessages = async (sessionId, token = null) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
    headers,
  });

  return handleResponse(response);
};

// Chat functions
export const sendMessage = async (message, sessionId = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  return handleResponse(response);
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      return { status: 'unhealthy', error: `${response.status} ${response.statusText}` };
    }
    return await response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
}; 