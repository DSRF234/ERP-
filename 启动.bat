@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   星野优选 ERP
echo ========================================
echo.
if not exist node_modules (
    echo [1/2] 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 ( echo 依赖安装失败，请检查网络 & pause & exit /b 1 )
)
echo [2/2] 启动开发服务器 http://localhost:5173
call npm run dev
pause
