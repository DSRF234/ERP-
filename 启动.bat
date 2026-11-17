@echo off
setlocal
title Xingye ERP
cd /d "%~dp0"

echo.
echo   ============================================
echo      Xingye ERP   -   starting ...
echo   ============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] npm not found. Please install Node.js 18+ first.
  echo   Download: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   First run: installing dependencies, please wait ...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERROR] npm install failed. Check your network and try again.
    echo.
    pause
    exit /b 1
  )
  echo.
)

echo   Starting dev server, the browser will open automatically.
echo   Keep this window open. Close it to stop the server.
echo.

call npm run dev

echo.
echo   Server stopped.
pause
