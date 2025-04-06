import logging
import os
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("kilokokua-backend")

# Import configuration, database and models
from .config import CORS_ORIGINS, LOG_LEVEL
from .database import engine, get_db, Base
from . import models, auth, chat
from .auth import Token, User, UserCreate, get_current_user, get_current_user_optional, get_current_active_user

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="KiloKōkua – The Hawaiʻi Climate AI Concierge",
    description="API backend for the Hawaiʻi Climate AI Concierge chatbot",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import AI service
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

# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Get an access token using username and password."""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with 1 day expiration for chatbot app
    access_token_expires = timedelta(days=1)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username exists
    db_user = auth.get_user(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    return auth.create_user(db=db, user=user)

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# Chat history endpoints
@app.get("/sessions", response_model=List[chat.ChatSessionResponse])
async def get_user_sessions(
    skip: int = 0, 
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user."""
    sessions = chat.get_chat_sessions_for_user(db, current_user.id, skip=skip, limit=limit)
    return sessions

@app.get("/sessions/{session_id}", response_model=chat.ChatSessionResponse)
async def get_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get a specific chat session."""
    session = chat.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Only allow access if the session belongs to the user or has no user (anonymous)
    if session.user_id and (not current_user or session.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    return session

@app.patch("/sessions/{session_id}", response_model=chat.ChatSessionResponse)
async def update_session(
    session_id: str,
    update_data: chat.ChatSessionUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Update a chat session."""
    session = chat.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Only allow updates if the session belongs to the user or has no user (anonymous)
    if session.user_id and (not current_user or session.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    updated_session = chat.update_chat_session(db, session_id, update_data)
    if not updated_session:
        raise HTTPException(status_code=500, detail="Failed to update chat session")
    
    return updated_session

@app.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Delete a chat session."""
    session = chat.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Only allow deletion if the session belongs to the user or has no user (anonymous)
    if session.user_id and (not current_user or session.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
    
    chat.delete_chat_session(db, session_id)
    return {"ok": True}

@app.get("/sessions/{session_id}/messages", response_model=List[chat.Message])
async def get_session_messages(
    session_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get messages for a chat session."""
    session = chat.get_chat_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Only allow access if the session belongs to the user or has no user (anonymous)
    if session.user_id and (not current_user or session.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    return chat.get_messages(db, session_id, skip=skip, limit=limit)

# Basic endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to KiloKōkua – The Hawaiʻi Climate AI Concierge API"}

# AI chat endpoint with history support
@app.post("/ask", response_model=ChatResponse)
async def ask(
    request: ChatRequest, 
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Received message: {request.message[:50]}{'...' if len(request.message) > 50 else ''}")
        
        # Get or create chat session
        session_id = request.session_id
        session = None
        
        if session_id:
            # Verify session exists
            session = chat.get_chat_session(db, session_id)
            if not session:
                # Create new session if ID doesn't exist
                session = chat.create_chat_session(db, user_id=current_user.id if current_user else None)
                session_id = session.id
            elif session.user_id and (not current_user or session.user_id != current_user.id):
                # If session belongs to a user, verify current user has access
                raise HTTPException(status_code=403, detail="Not authorized to access this session")
        else:
            # Create new session
            session = chat.create_chat_session(db, user_id=current_user.id if current_user else None)
            session_id = session.id
        
        # Save user message to history
        user_message = chat.MessageCreate(content=request.message, is_user=True)
        chat.add_message(db, session_id, user_message)
        
        # Get response from AI service
        _, reply = await ai_service.get_response(request.message, session_id)
        
        # Save bot response to history
        bot_message = chat.MessageCreate(content=reply, is_user=False)
        chat.add_message(db, session_id, bot_message)
        
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
        "auth_service": "available",
        "database": "connected",
        "environment": {
            "project_id": os.getenv("PROJECT_ID", "Not set"),
            "location": os.getenv("LOCATION", "Not set"),
            # Don't include actual values or secrets, just status
            "project_id_set": bool(os.getenv("PROJECT_ID")),
            "location_set": bool(os.getenv("LOCATION")),
        }
    }
