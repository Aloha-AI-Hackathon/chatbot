import os
import logging
from typing import Optional, Tuple, Any, Dict
import random
import time

# Configure logger
logger = logging.getLogger("kilokokua-backend")

# Try to import Google Generative AI package
GENAI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types
    from google.genai.types import Part
    GENAI_AVAILABLE = True
    logger.info("Using Google GenAI SDK")
except ImportError:
    logger.error("Could not import Google GenAI. Will use fallback mode.")

import google.auth
import httpx

def _project_id() -> str:
    """Use the Google Auth helper (via the metadata service) to get the Google Cloud Project"""
    try:
        _, project = google.auth.default()
    except Exception as e:
        logger.error(f"Could not automatically determine credentials: {str(e)}")
        return None
    if not project:
        logger.error("Could not determine project from credentials.")
        return None
    return project

def _region() -> str:
    """Use the local metadata service to get the region"""
    try:
        resp = httpx.get(
            "http://metadata.google.internal/computeMetadata/v1/instance/region",
            headers={"Metadata-Flavor": "Google"},
        )
        return resp.text.split("/")[-1]
    except Exception:
        return "us-central1"

class AIService:
    def __init__(self):
        self.initialized = False
        self.model_name = "gemini-2.0-flash-001"
        self.client = None
        self.fallback_mode = not GENAI_AVAILABLE
        self.sessions: Dict[str, list] = {}
        self.initialize()
    
    def initialize(self) -> None:
        """Initialize connection to Google GenAI."""
        # If GenAI isn't available, use fallback mode
        if not GENAI_AVAILABLE:
            logger.warning("Google GenAI not available. Using fallback mode.")
            self.fallback_mode = True
            self.initialized = True
            return
            
        try:
            # Get credentials and project info using environment variables or auto-detection
            api_key = os.environ.get("GOOGLE_API_KEY")
            project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("PROJECT_ID") or _project_id()
            location = os.environ.get("GOOGLE_CLOUD_REGION") or os.environ.get("LOCATION") or _region()
            
            if not (project_id and location):
                raise ValueError("Missing required information: PROJECT_ID, LOCATION")
            
            # Check for Google Cloud authentication
            gcp_auth_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if gcp_auth_file:
                logger.info(f"Using Google Cloud credentials from: {gcp_auth_file}")
                if not os.path.exists(gcp_auth_file):
                    logger.warning(f"Credentials file not found: {gcp_auth_file}")
            else:
                logger.warning("GOOGLE_APPLICATION_CREDENTIALS environment variable not set. "
                               "Using default application credentials if available.")
            
            # Initialize the GenAI client
            self.client = genai.Client(
                vertexai=True,
                project=project_id,
                location=location,
                api_key=api_key,
            )
            
            # Test with a simple request
            try:
                logger.info(f"Testing connection to {self.model_name}...")
                test_contents = [
                    types.Content(
                        role="user",
                        parts=[Part(text="Hello, please respond with a single word.")]
                    )
                ]
                
                test_config = types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=10,
                )
                
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=test_contents,
                    config=test_config,
                )
                
                logger.info(f"Test successful: {response.text}")
                self.initialized = True
                self.fallback_mode = False
                logger.info(f"Successfully initialized GenAI with project_id={project_id}, location={location}")
                
            except Exception as test_e:
                logger.warning(f"API connection test failed: {str(test_e)}")
                logger.warning("Switching to fallback mode")
                self.fallback_mode = True
                self.initialized = True
                
        except Exception as e:
            logger.error(f"Failed to initialize GenAI: {str(e)}")
            logger.warning("Switching to fallback mode")
            self.initialized = True
            self.fallback_mode = True
    
    # Fallback responses for when GenAI is not available
    def get_fallback_response(self, message: str) -> str:
        """Generate a fallback response when the AI service is not available."""
        # Simple canned responses about Hawaii climate
        canned_responses = [
            "Aloha! I'm currently in fallback mode due to connectivity issues with my knowledge base. "
            "Climate change is a significant concern for Hawaii, with rising sea levels and changing weather patterns.",
            
            "I apologize, but I'm operating in limited mode. Hawaii typically has two seasons: summer (May to October) "
            "and winter (November to April). The average temperature ranges from 78°F to 85°F.",
            
            "I'm currently running in fallback mode. Hawaii is known for its diverse microclimates, ranging from "
            "tropical rainforests to arid deserts, all within short distances.",
            
            "Due to technical limitations, I'm in fallback mode. Hawaii is vulnerable to climate change impacts "
            "including coral bleaching, coastal erosion, and more frequent extreme weather events.",
            
            "I'm sorry, but I'm in fallback mode with limited capabilities. The Hawaiian Islands are affected by "
            "trade winds which typically blow from the northeast and contribute to the pleasant climate."
        ]
        
        # If asking about capabilities or status
        if any(keyword in message.lower() for keyword in ['who are you', 'what can you do', 'your purpose', 'about you']):
            return ("Aloha! I'm KiloKōkua, the Hawaii Climate AI Concierge. I'm currently operating in fallback mode "
                   "due to connectivity issues with my knowledge base. Normally, I provide information about Hawaii's "
                   "climate, weather patterns, and sustainability efforts.")
        
        # Return a random canned response with a small delay to simulate thinking
        time.sleep(1)
        return random.choice(canned_responses)
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> Tuple[str, list]:
        """Get existing chat session or create a new one."""
        # For fallback mode, just return a dummy session
        if self.fallback_mode:
            logger.info("Using fallback session")
            new_session_id = session_id or str(hash(time.time()))
            return new_session_id, []
            
        # Handle invalid session_id values
        if not session_id or session_id in ["string", "null", "undefined", "None", ""]:
            logger.info(f"Ignoring invalid session_id: {session_id}")
            session_id = None
            
        # Return existing session if valid
        if self.initialized and session_id and session_id in self.sessions:
            logger.info(f"Using existing chat session: {session_id}")
            return session_id, self.sessions[session_id]
        
        # Check initialization
        if not self.initialized:
            logger.warning("AI service not initialized, attempting to initialize again")
            self.initialize()
            if not self.initialized:
                raise RuntimeError("AI service failed to initialize")
        
        # Create a new session with system prompt
        system_prompt = """You are KiloKōkua, the Hawaiʻi Climate AI Concierge. 
        You provide information about Hawaiʻi's climate, weather patterns, 
        climate change impacts, and sustainability efforts. Be helpful, 
        accurate, and focus on providing information relevant to the Hawaiian Islands.
        If asked about topics unrelated to Hawaiʻi or climate, politely redirect 
        the conversation to your area of expertise."""
        
        # Initialize a new conversation history
        history = [
            types.Content(
                role="model",
                parts=[Part(text="Aloha! I'm KiloKōkua, your Hawaiʻi Climate AI Concierge. How can I help you with information about Hawaiʻi's climate today?")]
            )
        ]
        
        # Generate a unique session ID if none provided
        new_session_id = session_id or str(hash(time.time()))
        self.sessions[new_session_id] = history
        logger.info(f"Created new chat session: {new_session_id}")
        
        return new_session_id, history
    
    async def get_response(self, message: str, session_id: Optional[str] = None) -> Tuple[str, str]:
        """Get a response from the AI model for the given message."""
        if not message.strip():
            return session_id or "", "Aloha! Please ask me a question about Hawaiʻi's climate."
        
        # Sanitize session_id
        if session_id in ["string", "null", "undefined", "None", ""]:
            logger.warning(f"Received invalid session_id: {session_id}, setting to None")
            session_id = None
        
        # Use fallback mode if GenAI is not available
        if self.fallback_mode:
            logger.info("Using fallback response mode")
            new_session_id = session_id or str(hash(time.time()))
            fallback_reply = self.get_fallback_response(message)
            return new_session_id, fallback_reply
        
        try:
            # Get or create session
            session_id, history = self.get_or_create_session(session_id)
            
            # Add user message to history
            user_message = types.Content(
                role="user",
                parts=[Part(text=message)]
            )
            
            # Prepare contents for the API call
            # Only include the last few messages to avoid exceeding token limits
            contents = []
            if len(history) > 0:
                # Add last few messages from history (up to 5)
                contents.extend(history[-5:])
            
            # Add current user message
            contents.append(user_message)
            
            # Configure the request
            generate_config = types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.95,
                max_output_tokens=2048,
            )
            
            # Call the API
            logger.info(f"Sending message to {self.model_name}")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_config,
            )
            
            # Extract response text
            if hasattr(response, 'text'):
                reply = response.text
            else:
                # Fallback handling if text property is missing
                reply = str(response.candidates[0].content.parts[0].text) if response.candidates else "I apologize, but I couldn't generate a response."
            
            # Add the response to history
            model_response = types.Content(
                role="model",
                parts=[Part(text=reply)]
            )
            history.append(user_message)
            history.append(model_response)
            
            # Update session history
            self.sessions[session_id] = history
            
            logger.info(f"AI response generated successfully for session {session_id}")
            return session_id, reply
            
        except Exception as e:
            logger.error(f"Error getting AI response: {str(e)}")
            
            # If there's an error with this session, try creating a new one
            if session_id in self.sessions:
                del self.sessions[session_id]
                logger.info(f"Removed problematic session: {session_id}")
            
            # Return a friendly error message
            return "", "Mahalo for your patience. I'm having trouble connecting to my knowledge base right now. Please try again in a moment."

# Singleton instance
ai_service = AIService() 