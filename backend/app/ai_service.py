import os
import logging
from typing import Optional, Tuple, Any, Dict
import importlib.util
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession, Content

# Configure logger
logger = logging.getLogger("kilokokua-backend")

# Check which version of Vertex AI we have
USING_LEGACY_API = False
try:
    from vertexai.generative_models import GenerativeModel, ChatSession, Content
    logger.info("Using newer Vertex AI SDK with generative_models")
except ImportError:
    try:
        # Fall back to legacy PaLM API
        from vertexai.language_models import ChatModel, TextGenerationModel
        logger.info("Using legacy Vertex AI SDK with language_models (PaLM API)")
        USING_LEGACY_API = True
    except ImportError:
        logger.error("Could not import Vertex AI language models. Please check your installation.")

class AIService:
    def __init__(self):
        self.initialized = False
        self.model = None
        self.sessions: Dict[str, Any] = {}
        self.initialize()
    
    def initialize(self) -> None:
        """Initialize connection to Vertex AI."""
        try:
            project_id = os.getenv("PROJECT_ID")
            location = os.getenv("LOCATION")
            
            if not project_id or not location:
                raise ValueError("Missing required environment variables: PROJECT_ID, LOCATION")
            
            vertexai.init(project=project_id, location=location)
            
            if USING_LEGACY_API:
                # Legacy PaLM API
                self.model = ChatModel.from_pretrained("chat-bison@001")
                logger.info("Initialized with legacy PaLM API (chat-bison)")
            else:
                # Newer Gemini API
                self.model = GenerativeModel("gemini-pro")
                logger.info("Initialized with Gemini API")
                
            self.initialized = True
            logger.info(f"Successfully initialized Vertex AI with project_id={project_id}, location={location}")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            self.initialized = False
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> Tuple[str, Any]:
        """Get existing chat session or create a new one."""
        if self.initialized and session_id and session_id in self.sessions:
            logger.info(f"Using existing chat session: {session_id}")
            return session_id, self.sessions[session_id]
        
        if not self.initialized:
            logger.warning("AI service not initialized, attempting to initialize again")
            self.initialize()
            if not self.initialized:
                raise RuntimeError("AI service failed to initialize")
        
        context = """You are KiloKōkua, the Hawaiʻi Climate AI Concierge. 
        You provide information about Hawaiʻi's climate, weather patterns, 
        climate change impacts, and sustainability efforts. Be helpful, 
        accurate, and focus on providing information relevant to the Hawaiian Islands.
        If asked about topics unrelated to Hawaiʻi or climate, politely redirect 
        the conversation to your area of expertise."""
        
        # Create a new chat session based on API version
        if USING_LEGACY_API:
            # Legacy PaLM API
            chat = self.model.start_chat(
                context=context,
                examples=[
                    {
                        "input_text": "Tell me about yourself",
                        "output_text": "Aloha! I'm KiloKōkua, your Hawaiʻi Climate AI Concierge. I can provide information about Hawaiʻi's climate, weather patterns, sustainability efforts, and more."
                    }
                ]
            )
        else:
            # Newer Gemini API
            chat = self.model.start_chat(
                context=context,
                history=[
                    Content(
                        role="model",
                        parts=["Aloha! I'm KiloKōkua, your Hawaiʻi Climate AI Concierge. How can I help you with information about Hawaiʻi's climate today?"]
                    )
                ]
            )
        
        # Generate a unique session ID if none provided
        new_session_id = session_id or str(hash(chat))
        self.sessions[new_session_id] = chat
        logger.info(f"Created new chat session: {new_session_id}")
        
        return new_session_id, chat
    
    async def get_response(self, message: str, session_id: Optional[str] = None) -> Tuple[str, str]:
        """Get a response from the AI model for the given message."""
        if not message.strip():
            return session_id or "", "Aloha! Please ask me a question about Hawaiʻi's climate."
        
        try:
            session_id, chat = self.get_or_create_session(session_id)
            
            # Generate response based on API version
            if USING_LEGACY_API:
                # Legacy PaLM API
                response = chat.send_message(message)
                reply = response.text
            else:
                # Newer Gemini API
                response = chat.send_message(message)
                reply = response.text
            
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