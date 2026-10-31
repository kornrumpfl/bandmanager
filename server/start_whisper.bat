@echo off
title BandManager - Local Whisper AI Server
echo ========================================================
echo   Starting BandManager Whisper AI Server...
echo   Usage: start_whisper.bat [model: tiny|base|small] [port: e.g. 8000]
echo   Example: start_whisper.bat base 8000
echo ========================================================
python server/whisper_server.py %*
pause
