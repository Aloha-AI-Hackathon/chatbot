from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from . import models
from .models import User, ChatSession, ChatMessage

# Pydantic models for chat
class MessageBase(BaseModel):
    content: str
    is_user: bool = True

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    chat_session_id: str
    created_at: datetime
    message_metadata: Optional[dict] = None

    class Config:
        orm_mode = True

class ChatSessionBase(BaseModel):
    title: Optional[str] = None

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSessionUpdate(ChatSessionBase):
    pass

class ChatSessionResponse(ChatSessionBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_message_at: datetime
    messages: List[Message] = []

    class Config:
        orm_mode = True

# Chat session functions
def get_chat_session(db: Session, session_id: str) -> Optional[ChatSession]:
    """Get a chat session by ID."""
    return db.query(ChatSession).filter(ChatSession.id == session_id).first()

def get_chat_sessions_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ChatSession]:
    """Get all chat sessions for a user."""
    return db.query(ChatSession).filter(ChatSession.user_id == user_id)\
        .order_by(ChatSession.last_message_at.desc())\
        .offset(skip).limit(limit).all()

def create_chat_session(db: Session, user_id: Optional[int] = None) -> ChatSession:
    """Create a new chat session, optionally associated with a user."""
    db_chat_session = ChatSession(user_id=user_id)
    db.add(db_chat_session)
    db.commit()
    db.refresh(db_chat_session)
    return db_chat_session

def update_chat_session(db: Session, session_id: str, update_data: ChatSessionUpdate) -> Optional[ChatSession]:
    """Update a chat session."""
    db_chat_session = get_chat_session(db, session_id)
    if not db_chat_session:
        return None
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(db_chat_session, key, value)
    
    db_chat_session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_chat_session)
    return db_chat_session

def delete_chat_session(db: Session, session_id: str) -> bool:
    """Delete a chat session."""
    db_chat_session = get_chat_session(db, session_id)
    if not db_chat_session:
        return False
    
    db.delete(db_chat_session)
    db.commit()
    return True

# Chat message functions
def get_messages(db: Session, session_id: str, skip: int = 0, limit: int = 100) -> List[ChatMessage]:
    """Get messages for a chat session."""
    return db.query(ChatMessage).filter(ChatMessage.chat_session_id == session_id)\
        .order_by(ChatMessage.created_at)\
        .offset(skip).limit(limit).all()

def add_message(db: Session, session_id: str, message: MessageCreate, metadata: Optional[dict] = None) -> ChatMessage:
    """Add a message to a chat session."""
    # Update the last_message_at timestamp on the session
    db_chat_session = get_chat_session(db, session_id)
    if not db_chat_session:
        raise ValueError(f"Chat session with ID {session_id} not found")
    
    db_chat_session.last_message_at = datetime.utcnow()
    
    # Create and add the message
    db_message = ChatMessage(
        chat_session_id=session_id, 
        content=message.content, 
        is_user=message.is_user,
        message_metadata=metadata
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def clear_chat_history(db: Session, session_id: str) -> bool:
    """Clear all messages from a chat session."""
    result = db.query(ChatMessage).filter(ChatMessage.chat_session_id == session_id).delete()
    db.commit()
    return result > 0 