import uvicorn
import os
import sys
from dotenv import load_dotenv
import logging

def setup_logger():
    """Set up the logger for the run script."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    return logging.getLogger("kilokokua-run")

if __name__ == "__main__":
    logger = setup_logger()
    logger.info("Starting KiloKōkua – The Hawaiʻi Climate AI Concierge API")
    
    # Check Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    logger.info(f"Python version: {python_version}")
    
    if sys.version_info >= (3, 13, 0):
        logger.warning("You are using Python 3.13+. This may cause compatibility issues with some libraries.")
        logger.warning("If you encounter errors, consider downgrading to Python 3.10 or 3.11.")
    
    # Load environment variables
    load_dotenv()
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Get app import path - handle both development and installed modes
    app_path = os.getenv("APP_MODULE", "app.main:app")
    logger.info(f"Starting server with app module: {app_path}")
    
    # Check if Google Cloud environment variables are set
    project_id = os.getenv("PROJECT_ID")
    location = os.getenv("LOCATION")
    
    if not project_id or not location:
        logger.warning("Environment variables PROJECT_ID and/or LOCATION are not set")
        logger.warning("Vertex AI integration will not work without these variables")
    
    # Start server
    try:
        uvicorn.run(
            app_path,
            host="0.0.0.0",
            port=port,
            reload=True,  # Enable auto-reload for development
            log_level=os.getenv("LOG_LEVEL", "info").lower(),
        )
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1) 