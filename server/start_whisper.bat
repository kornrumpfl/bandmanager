@echo off
title BandManager - Local Whisper AI Server
echo ========================================================
echo   Starting BandManager Whisper AI Server...
echo   Usage: start_whisper.bat [tiny^|base^|small]
echo   Endpoint: http://0.0.0.0:5001
echo ========================================================
python server/whisper_server.py %*
pause
