@echo off
echo Setting up KiloKokua Backend...

REM Check for Python
python --version 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Python not found! Please install Python 3.10 or 3.11.
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install wheel
pip install -e . --no-build-isolation

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
)

echo.
echo Setup completed!
echo.
echo Next steps:
echo 1. Edit your .env file to set your Google Cloud PROJECT_ID and LOCATION
echo 2. Set up Google Cloud authentication with 'gcloud auth application-default login'
echo 3. Run the server with 'python run.py'
echo.
pause 