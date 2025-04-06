#!/usr/bin/env python3
"""
Database migration script for KiloKōkua backend.
This script initializes and migrates the database schema for production deployment.
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import configuration
from app.config import DATABASE_URL, ENV
from app.database import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("kilokokua-migration")

def run_migrations():
    """Run database migrations."""
    logger.info(f"Starting database migrations for environment: {ENV}")
    logger.info(f"Using database URL: {DATABASE_URL.replace(':'.join(DATABASE_URL.split(':')[1:2]), ':*****')}")
    
    try:
        # Create engine
        engine = create_engine(
            DATABASE_URL, 
            connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        )
        
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # For PostgreSQL, we might want to run additional setup
        if not DATABASE_URL.startswith("sqlite"):
            with engine.connect() as connection:
                # Enable UUID extension if using PostgreSQL
                if DATABASE_URL.startswith("postgresql"):
                    logger.info("Enabling UUID extension for PostgreSQL...")
                    connection.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
                    connection.commit()
        
        logger.info("Database migration completed successfully.")
        return True
    
    except SQLAlchemyError as e:
        logger.error(f"Database migration failed: {str(e)}")
        return False
    
    except Exception as e:
        logger.error(f"Unexpected error during migration: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
