@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo    Xingye ERP  -  Dev Server
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found.
  echo Please install Node.js 18 or above: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/2] Installing dependencies, this may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. Check your network.
    pause
    exit /b 1
  )
  echo.
)

echo [2/2] Starting dev server ...
echo       Open http://localhost:5173 in your browser
echo       Close this window to stop the server
echo.

call npm run dev

echo.
echo Server stopped.
pause
