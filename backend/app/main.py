import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from .ai_service import ai_service

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
    return {"status": "healthy", "ai_service_initialized": ai_service.initialized} 