interface ChatRequest {
  message: string;
  session_id: string | null;
}

interface ChatResponse {
  reply: string;
  session_id: string;
}

const API_BASE_URL = 'http://localhost:8000';

/**
 * Send a message to the KiloKōkua backend API
 */
export const sendMessage = async (message: string, sessionId: string | null = null): Promise<ChatResponse> => {
  try {
    // Ensure message is a string and not empty
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }
    
    // Properly handle session_id to avoid sending invalid values
    let session_id = null;
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
      headers: {
        'Content-Type': 'application/json',
      },
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

    return await response.json();
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
    
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}; 