# KiloKōkua – The Hawaiʻi Climate AI Concierge - Backend API

This is the backend API for the KiloKōkua chatbot, which provides information about Hawaiʻi's climate using Google Cloud Vertex AI.

## Requirements

- Python 3.10+ (recommended Python 3.10 or 3.11; Python 3.13 may have compatibility issues)
- Google Cloud account with Vertex AI API enabled
- Google Cloud SDK installed and configured

## Setup

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
# If using Python 3.13, specify Python 3.10 or 3.11 if available:
python3.10 -m venv venv
# Or
python -m venv venv
```

3. Activate the virtual environment:
   - On Windows:
   ```bash
   venv\Scripts\activate
   ```
   - On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file from the example:
```bash
cp .env.example .env
```

6. Edit the `.env` file with your Google Cloud project details.

7. Set up Google Cloud authentication:
```bash
# Log in with Google Cloud SDK
gcloud auth application-default login

# Make sure you're authenticated with the correct project
gcloud config set project YOUR_PROJECT_ID
```

## Troubleshooting

### Python Version Issues
If you encounter errors related to incompatible Python versions:
- Try using Python 3.10 or 3.11 instead of newer versions
- If you must use Python 3.13+, you may need to update the dependencies manually:
  ```bash
  pip install --upgrade fastapi pydantic uvicorn
  ```

### Rust/Cargo Requirements
Some dependencies may require Rust and Cargo to be installed:
- Install Rust via https://rustup.rs/
- Add Rust to your PATH
- Or try installing binary wheels: `pip install --only-binary=:all: -r requirements.txt`

## Running the API

Start the FastAPI server:
```bash
python run.py
```

The API will be available at http://localhost:8000.

## API Endpoints

- `GET /`: Welcome message
- `GET /health`: Health check endpoint
- `POST /ask`: Submit a message to the chatbot
  - Request body: `{"message": "Your question here", "session_id": "optional-session-id"}`
  - Response: `{"reply": "AI response", "session_id": "session-id-for-continuation"}`

## Development

The server runs with auto-reload enabled, so any changes to the code will automatically restart the server.

## Environment Variables

- `PROJECT_ID`: Your Google Cloud project ID
- `LOCATION`: Google Cloud region where Vertex AI is enabled (e.g., us-central1)
- `PORT`: Port for the FastAPI server (default: 8000)
- `LOG_LEVEL`: Logging level (default: INFO) 