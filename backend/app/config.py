import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Environment
ENV = os.getenv("ENV", "development")

# Database configuration
if ENV == "production":
    # Cloud SQL configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME", "kilokokua")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    
    # Construct the database URL
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
else:
    # SQLite for development
    DATABASE_URL = "sqlite:///./kilokokua.db"

# Google Cloud configuration
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION", "us-central1")

# API configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# JWT Secret for authentication
SECRET_KEY = os.getenv("SECRET_KEY", "development_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
