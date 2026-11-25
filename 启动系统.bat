@echo off
setlocal
title Xingye ERP - Launcher
cd /d "%~dp0"

echo.
echo   [1/2] Starting database API ...
start "Xingye ERP API" "%~dp0启动后端.bat"

echo   [2/2] Waiting for the API to be ready ...
timeout /t 4 /nobreak >nul

call "%~dp0启动.bat"
