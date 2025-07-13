@echo off
echo 🚀 Starting GitHub Project Analyzer...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if requirements are installed
echo 📦 Checking dependencies...
pip show django >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Dependencies not found. Installing...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo ⚠️  Creating .env file with default settings...
    echo # Django Settings > .env
    echo SECRET_KEY=django-insecure-change-this-in-production >> .env
    echo DEBUG=True >> .env
    echo ALLOWED_HOSTS=localhost,127.0.0.1 >> .env
    echo. >> .env
    echo # GitHub API Configuration (Optional) >> .env
    echo # GITHUB_TOKEN=your-github-token-here >> .env
    echo ✅ Created .env file
)

echo.
echo 🚀 Starting server...
echo 📍 Visit: http://127.0.0.1:8000
echo 🛑 Press Ctrl+C to stop
echo.

python run.py

pause 