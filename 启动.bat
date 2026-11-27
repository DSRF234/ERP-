@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title 星野优选 ERP · 一键启动
cd /d "%~dp0"

set "API_PORT=3001"
set "WEB_PORT=5173"
set "WAIT_MAX=40"
set "MYSQL_PORT=3306"
if not defined MYSQL_HOME set "MYSQL_HOME=C:\Users\jzh\mysql\mysql-8.0.46-winx64"

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
echo   [1/4] 检查数据库 MySQL 端口 %MYSQL_PORT% ...
call :port_open %MYSQL_PORT%
if "!PORT_OPEN!"=="1" goto mysql_already
if not exist "%MYSQL_HOME%\bin\mysqld.exe" goto mysql_missing
echo          未检测到，正在启动，会弹出 MySQL 窗口，请不要关闭
start "星野ERP-MySQL" /d "%MYSQL_HOME%\bin" cmd /k mysqld.exe --defaults-file=%MYSQL_HOME%\my.ini --console
call :wait_port %MYSQL_PORT%
if "!PORT_OPEN!"=="1" goto mysql_ready
echo.
echo   [错误] MySQL 启动超时，请查看 MySQL 窗口里的报错
echo          常见原因：上一次没有正常关闭、3306 被别的程序占用
echo.
pause
exit /b 1

:mysql_missing
echo.
echo   [错误] 未找到 MySQL：%MYSQL_HOME%\bin\mysqld.exe
echo          请把本文件顶部的 MYSQL_HOME 改成实际安装目录后重试
echo.
pause
exit /b 1

:mysql_already
echo          已在运行，跳过

:mysql_ready
echo          数据库就绪

echo   [2/4] 启动后端服务 ...
start "星野ERP-后端" /d "%~dp0server" cmd /k node src/index.js

set /a n=0
:wait_api
timeout /t 1 /nobreak >nul
curl -s -o nul "http://localhost:%API_PORT%/api/health"
if not errorlevel 1 goto api_ready
set /a n+=1
if !n! lss %WAIT_MAX% goto wait_api
echo   [错误] 后端服务启动超时，请查看“星野ERP-后端”窗口的报错。
echo          常见原因：MySQL 未启动、账号密码不是 root/123456。
echo.
pause
exit /b 1
:api_ready
echo          已就绪（耗时约 !n! 秒）

echo   [3/4] 启动前端服务 ...
start "星野ERP-前端" /d "%~dp0" cmd /k npm run dev -- --port %WEB_PORT% --strictPort

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

echo   [4/4] 打开浏览器 ...
start "" "http://localhost:%WEB_PORT%"

echo.
echo   ================================================
echo      启动完成
echo.
echo      前端页面   http://localhost:%WEB_PORT%
echo      后端接口   http://localhost:%API_PORT%/api/health
echo      数据库     MySQL 端口 %MYSQL_PORT% / erp_xingye
echo.
echo      关闭系统：关闭本脚本弹出的黑色窗口即可
echo                MySQL 若原本已在运行，则不受影响
echo      本窗口   10 秒后自动关闭
echo   ================================================
timeout /t 10 /nobreak >nul
exit /b 0

:port_open
set "PORT_OPEN=0"
for /f "tokens=1,4" %%A in ('netstat -ano ^| findstr /C:":%~1 "') do (
  if /i "%%B"=="LISTENING" set "PORT_OPEN=1"
)
exit /b 0

:wait_port
set /a n=0
:wait_port_loop
timeout /t 1 /nobreak >nul
call :port_open %~1
if "!PORT_OPEN!"=="1" exit /b 0
set /a n+=1
if !n! lss %WAIT_MAX% goto wait_port_loop
exit /b 1
