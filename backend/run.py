import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Start server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    ) 