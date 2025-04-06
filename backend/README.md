# KiloKōkua – The Hawaiʻi Climate AI Concierge

A fullstack chatbot application that provides information about Hawaiʻi's climate using Google's Generative AI API (Gemini). The project consists of a FastAPI backend and a React frontend.

![KiloKōkua Logo](https://via.placeholder.com/200x100?text=KiloKōkua)

## Project Structure

```
chatbot/
├── .gitignore        # Root level gitignore
├── backend/           # FastAPI backend
│   ├── .gitignore    # Backend specific gitignore
│   ├── app/           # Application code
│   │   ├── ai_service.py  # Gemini AI integration
│   │   ├── main.py    # FastAPI application
│   │   └── __init__.py
│   ├── .env           # Environment variables (create from .env.example)
│   ├── requirements.txt  # Python dependencies
│   ├── run.py         # Entry point for the backend server
│   └── setup.py       # Python package setup
│
└── chatbot/           # React frontend
    ├── .gitignore    # Frontend specific gitignore
    ├── public/        # Static assets
    ├── src/           # React source code
    │   ├── components/  # React components
    │   ├── services/    # API services
    │   └── App.tsx    # Main React component
    ├── package.json   # Node.js dependencies
    └── tsconfig.json  # TypeScript configuration
```

## Prerequisites

- Python 3.8+ (3.10 or 3.11 recommended)
- Node.js 18+ and npm
- Google Cloud account with Generative AI API enabled
- Google Cloud authentication configured

## Backend Setup

1. Navigate to the backend directory:
   ```powershell
   # PowerShell
   cd backend
   ```

2. Create a virtual environment:
   ```powershell
   # Windows - PowerShell
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux - Bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Create `.env` file from the example:
   ```powershell
   # Windows - PowerShell
   copy .env.example .env

   # macOS/Linux - Bash
   cp .env.example .env
   ```

5. Update the `.env` file with your Google Cloud project details:
   ```
   PROJECT_ID=your-google-cloud-project-id
   LOCATION=us-central1  # Or your preferred GCP region
   ```

6. Set up Google Cloud authentication:
   ```powershell
   # Log in with Google Cloud SDK
   gcloud auth application-default login

   # Set your project ID
   gcloud config set project YOUR_PROJECT_ID
   ```

   Or set the environment variable to your credentials file:
   ```powershell
   # Windows - PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS="path\to\your\credentials.json"

   # macOS/Linux - Bash
   export GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
   ```

7. Start the backend server:
   ```powershell
   python run.py
   ```
   
   The server will run at http://localhost:8000

## Frontend Setup

1. Navigate to the frontend directory from the project root:
   ```powershell
   # PowerShell
   cd chatbot
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm start
   ```
   
   The React app will run at http://localhost:3000

## API Endpoints

- `GET /`: Welcome message
- `GET /health`: Health check endpoint
- `POST /ask`: Submit a message to the chatbot
  - Request body: `{"message": "Your question here", "session_id": ""}`
  - Response: `{"reply": "AI response", "session_id": "session-id-for-continuation"}`

## Troubleshooting

### API Connection Issues
- Verify both servers are running (backend on port 8000, frontend on port 3000)
- Check browser console for any CORS errors
- Ensure your `.env` file has the correct Google Cloud project settings
- Test the API directly with tools like `curl` or Postman

### Authentication Issues
- Make sure you've run `gcloud auth application-default login`
- Verify your Google Cloud project has the Generative AI API enabled
- Check that your service account has proper permissions

### Dependency Issues
- If you encounter issues with `google-generativeai`, ensure you have the compatible version of `anyio`:
  ```powershell
  pip install anyio==4.9.0 google-generativeai==0.8.4
  ```

### PowerShell Command Issues
- If you're using PowerShell and encounter errors with the `&&` operator (e.g., `cd backend && python run.py`), separate the commands:
  ```powershell
  cd backend
  python run.py
  ```

## Git and Version Control

The project includes `.gitignore` files to prevent sensitive and unnecessary files from being committed:

- Root `.gitignore`: Covers both Python and JavaScript patterns
- Backend `.gitignore`: Specifically for Python, virtual environments, and credentials
- Frontend `.gitignore`: React and Node.js specific patterns

Important files to NEVER commit:
- `.env` files with real credentials
- Google Cloud credentials JSON files
- Virtual environment folders (`venv/`)
- Build artifacts and `node_modules/`

## Sessions
The chatbot maintains conversation state through session IDs. A new session is created automatically on your first message. The session ID is returned in the API response and should be included in subsequent requests to maintain the conversation context.

## Development

### Backend
- The server runs with auto-reload enabled by default
- Check logs for detailed error messages
- Use the `/health` endpoint to verify AI service status

### Frontend
- Edit the `API_BASE_URL` in `src/services/api.ts` if your backend is running on a different port
- The UI shows connection status in the footer
- Check browser console for API response details

## License
[MIT License](LICENSE)

## Acknowledgements
- [Google Generative AI](https://cloud.google.com/generative-ai) for Gemini model
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework 