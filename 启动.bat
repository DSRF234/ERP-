@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title 星野优选 ERP · 一键启动
cd /d "%~dp0"

set "API_PORT=3001"
set "WEB_PORT=5173"
set "WAIT_MAX=40"

echo.
echo   ================================================
echo      星野优选 ERP   一 键 启 动
echo      后端 : http://localhost:%API_PORT%
echo      前端 : http://localhost:%WEB_PORT%
echo   ================================================
echo.

echo   [检查] Node.js ...
where node >nul 2>nul
if errorlevel 1 (
  echo   [错误] 未检测到 Node.js，请先安装 Node.js 18 及以上版本。
  echo          下载地址：https://nodejs.org/
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo          已安装 %%v

echo   [检查] 依赖 ...
if not exist "node_modules" (
  echo          正在安装前端依赖，请稍候 ...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo   [错误] 前端依赖安装失败。
    pause
    exit /b 1
  )
)
if not exist "server\node_modules" (
  echo          正在安装后端依赖，请稍候 ...
  pushd server
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    popd
    echo   [错误] 后端依赖安装失败。
    pause
    exit /b 1
  )
  popd
)
echo          依赖就绪

echo.
echo   [1/3] 启动数据库服务 ...
start "星野 ERP · 数据库服务" /d "%~dp0server" cmd /k node src/index.js

set /a n=0
:wait_api
timeout /t 1 /nobreak >nul
curl -s -o nul "http://localhost:%API_PORT%/api/health"
if not errorlevel 1 goto api_ready
set /a n+=1
if !n! lss %WAIT_MAX% goto wait_api
echo   [错误] 数据库服务启动超时，请查看“星野 ERP · 数据库服务”窗口的报错。
echo          常见原因：MySQL 未启动、账号密码不是 root/123456。
echo.
pause
exit /b 1
:api_ready
echo          已就绪（耗时约 !n! 秒）

echo   [2/3] 启动前端服务 ...
start "星野 ERP · 前端" /d "%~dp0" cmd /k npm run dev -- --port %WEB_PORT% --strictPort

set /a n=0
:wait_web
timeout /t 1 /nobreak >nul
curl -s -o nul "http://localhost:%WEB_PORT%"
if not errorlevel 1 goto web_ready
set /a n+=1
if !n! lss %WAIT_MAX% goto wait_web
echo   [警告] 前端未在预期时间内就绪，请查看“星野 ERP · 前端”窗口。
echo.
pause
exit /b 1
:web_ready
echo          已就绪（耗时约 !n! 秒）

echo   [3/3] 打开浏览器 ...
start "" "http://localhost:%WEB_PORT%"

echo.
echo   ================================================
echo      启动完成
echo.
echo      前端页面   http://localhost:%WEB_PORT%
echo      后端接口   http://localhost:%API_PORT%/api/health
echo      数据库     MySQL / erp_xingye
echo.
echo      关闭系统：关闭弹出的两个黑色窗口即可
echo      本窗口   10 秒后自动关闭
echo   ================================================
timeout /t 10 /nobreak >nul
exit /b 0
