@echo off
title Delta Learning Platform - Launcher
color 0A

echo.
echo  =============================================
echo    DELTA LEARNING PLATFORM - Starting Up...
echo  =============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Navigate to the app directory (same folder as this .bat file)
cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  [INFO] node_modules not found. Running npm install...
    echo.
    npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo  [ERROR] npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo  [INFO] Starting backend server (port 3001)...
echo  [INFO] Starting frontend client (port 5173)...
echo.
echo  -----------------------------------------------
echo   App will open at: http://localhost:5173
echo  -----------------------------------------------
echo.

:: Start the app (both servers via npm run dev)
start "" cmd /c "npm run dev"

:: Wait 5 seconds for servers to boot
echo  [INFO] Waiting for servers to start...
timeout /t 5 /nobreak >nul

:: Open the browser
echo  [INFO] Opening browser...
start "" "http://localhost:5173"

echo.
echo  [OK] Delta Learning Platform is running!
echo  [OK] Close this window or the server window to stop.
echo.
echo  Ports in use:
echo    Frontend : http://localhost:5173
echo    Backend  : http://localhost:3001
echo.
