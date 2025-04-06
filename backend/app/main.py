import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("kilokokua-backend")

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="KiloKōkua – The Hawaiʻi Climate AI Concierge",
    description="API backend for the Hawaiʻi Climate AI Concierge chatbot",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fix module imports - try both absolute and relative
try:
    # Try relative import first
    from .ai_service import ai_service
    logger.info("Loaded AI service via relative import")
except ImportError:
    try:
        # Fall back to absolute import
        from app.ai_service import ai_service
        logger.info("Loaded AI service via absolute import")
    except ImportError:
        logger.error("Could not import AI service module. This may cause issues.")
        # Create a stub ai_service as fallback
        class StubAIService:
            def __init__(self):
                self.initialized = False
                
            async def get_response(self, message, session_id=None):
                return "", "Error: AI service not available. Check server configuration."
                
        ai_service = StubAIService()

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: str = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str

@app.get("/")
async def root():
    return {"message": "Welcome to KiloKōkua – The Hawaiʻi Climate AI Concierge API"}

@app.post("/ask", response_model=ChatResponse)
async def ask(request: ChatRequest):
    try:
        logger.info(f"Received message: {request.message[:50]}{'...' if len(request.message) > 50 else ''}")
        
        # Get response from AI service
        session_id, reply = await ai_service.get_response(request.message, request.session_id)
        
        logger.info(f"AI response: {reply[:50]}{'...' if len(reply) > 50 else ''}")
        
        return ChatResponse(reply=reply, session_id=session_id)
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "ai_service_initialized": ai_service.initialized,
        "environment": {
            "project_id": os.getenv("PROJECT_ID", "Not set"),
            "location": os.getenv("LOCATION", "Not set"),
            # Don't include actual values or secrets, just status
            "project_id_set": bool(os.getenv("PROJECT_ID")),
            "location_set": bool(os.getenv("LOCATION")),
        }
    } 