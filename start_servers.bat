@echo off
echo Starting backend and frontend servers...

start cmd /k "cd backend && python run.py"
start cmd /k "cd chatbot && npm start"

echo Servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
