# KiloKōkua – The Hawaiʻi Climate AI Concierge

A climate-focused AI chatbot for Hawaiʻi, providing information and resources related to climate change, sustainability, and environmental issues specific to the Hawaiian islands.

## Features

- 🤖 AI-powered chatbot using Google Generative AI
- 💬 Persistent chat history
- 👤 User authentication
- 🔄 Session management
- 📱 Responsive UI

## Tech Stack

### Frontend
- React
- CSS
- Fetch API

### Backend
- FastAPI
- SQLAlchemy
- SQLite (development) / PostgreSQL (production)
- Google Generative AI
- JWT Authentication

## Setup Instructions

### Prerequisites
- Python 3.9+ 
- Node.js 16+
- npm or yarn
- Google Cloud account with Generative AI API access

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up your Google Cloud credentials:
- Create or use an existing Google Cloud project
- Enable the Vertex AI API
- Create a service account with Vertex AI User permissions
- Download the credentials JSON file
- Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your JSON file:
  - Windows: `set GOOGLE_APPLICATION_CREDENTIALS=path\to\credentials.json`
  - macOS/Linux: `export GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json`

6. Update the `.env` file in the backend directory with your Google Cloud project details:
```
PROJECT_ID=your-google-project-id
LOCATION=us-central1  # or your preferred GCP region
```

7. Run the backend server:
```bash
python run.py
```

The backend API will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the root directory (where the `package.json` file is located).

2. Install dependencies:
```bash
npm install
```
or
```bash
yarn
```

3. Start the development server:
```bash
npm start
```
or
```bash
yarn start
```

The frontend will be available at `http://localhost:3000`.

## Usage

1. Open `http://localhost:3000` in your browser.
2. Register a new account or log in if you already have one.
3. Start chatting with KiloKōkua!
4. Your conversations will be saved automatically and can be accessed later.

## API Endpoints

The backend provides the following API endpoints:

- `POST /token` - Get access token (login)
- `POST /register` - Register a new user
- `GET /users/me` - Get current user info
- `GET /sessions` - Get user's chat sessions
- `GET /sessions/{session_id}` - Get a specific chat session
- `DELETE /sessions/{session_id}` - Delete a chat session
- `GET /sessions/{session_id}/messages` - Get messages for a chat session
- `POST /ask` - Send a message to the AI
- `GET /health` - Check API health

## License

This project is licensed under the MIT License.