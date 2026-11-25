@echo off
setlocal
title Xingye ERP - API Server
cd /d "%~dp0server"

echo.
echo   ============================================
echo      Xingye ERP   -   Database API
echo   ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERROR] Node.js not found. Please install Node.js 18+ first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   Installing dependencies, please wait ...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo   [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo   Starting API on http://localhost:3001
echo   Database: erp_xingye  (MySQL root)
echo   Press Ctrl+C to stop.
echo.

node src/index.js
pause
