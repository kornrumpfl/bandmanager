@echo off
title BandManager - Local Whisper AI Server
setlocal EnableDelayedExpansion

echo ========================================================
echo   BandManager - Local Whisper AI Server
echo   Endpoint: http://0.0.0.0:5001
echo ========================================================

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10, 3.11, or 3.12 from https://www.python.org
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Check if required packages (especially 'av' and 'faster-whisper') are installed
python -c "import av, faster_whisper, fastapi, uvicorn" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Missing Python packages (such as 'av' or 'faster-whisper').
    echo Installing dependencies automatically...
    echo.
    python -m pip install --upgrade pip
    python -m pip install -r "%~dp0requirements.txt"
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] Automatic package installation failed.
        echo Try running manually:
        echo    python -m pip install "av<18" faster-whisper fastapi uvicorn python-multipart ctranslate2
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
)

:: Run server from the server script directory
echo Starting Whisper server on port 5001...
python "%~dp0whisper_server.py" %*
pause
