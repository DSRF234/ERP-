@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   星野优选 ERP - 本地开发环境
echo ========================================
echo.

if not exist node_modules (
    echo [1/2] 首次运行，正在安装依赖，请耐心等待...
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
    echo.
)

echo [2/2] 启动开发服务器...
echo       浏览器会打开 http://localhost:5173
echo       关闭本窗口即停止服务
echo.

call npm run dev
pause
