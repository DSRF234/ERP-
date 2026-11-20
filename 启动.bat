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

rem ============================================================
rem  Already running? Then just open the browser and quit.
rem  Two dev servers on 5173 / 5174 is the #1 cause of
rem  "I changed the code but the page still shows the old one":
rem  the browser was pointing at the OLD instance.
rem ============================================================
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo   Dev server is ALREADY RUNNING on http://localhost:5173
  echo   Opening the browser now - no need to start a second copy.
  echo.
  echo   If the page still looks stale, close the older black
  echo   console window first, then run this file again.
  echo.
  start "" "http://localhost:5173"
  exit /b 0
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

echo   Dev server: http://localhost:5173
echo   Keep this window open.
echo   After editing any file, just press F5 in the browser.
echo.

call npm run dev

echo.
echo   Server stopped. Read the message above if this was unexpected.
if errorlevel 1 (
  echo.
  echo   If it says "Port 5173 is already in use", another copy of the
  echo   server is still running. Either close its console window, or
  echo   run this file again - it will simply open the browser.
)
echo.
pause
