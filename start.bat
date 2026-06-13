@echo off
title Pacemaker Institute - Dev Server

echo ============================================
echo  Pacemaker Institute - Starting Up...
echo ============================================

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto wait_docker
    echo [OK] Docker is now running.
)

:: Start MySQL container
echo [1/4] Starting MySQL container...
docker compose up -d mysql
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start MySQL container.
    pause
    exit /b 1
)

:: Wait for MySQL to be healthy
echo [2/4] Waiting for MySQL to be ready...
:wait_mysql
docker compose exec -T mysql mysqladmin ping -h localhost -u root -ppacemaker_dev --silent >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
    goto wait_mysql
)
echo [OK] MySQL is ready.

:: Push database schema and seed
echo [3/4] Pushing database schema...
call npm run db:push
if %errorlevel% neq 0 (
    echo [WARN] Schema push had issues, continuing...
)

echo [4/4] Starting dev server...
echo.
echo ============================================
echo  Server will be at: http://localhost:5173
echo ============================================
echo.

call npm run dev

pause
