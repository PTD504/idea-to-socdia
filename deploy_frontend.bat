@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Google Cloud Run Deployment Script (FRONTEND)
echo ==========================================
echo.

REM 1. Verify gcloud
where gcloud >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Google Cloud SDK is not installed.
    pause
    exit /b 1
)

REM 2. Check Authentication
echo [INFO] Checking authentication status...
call gcloud auth print-access-token >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] You are not authenticated.
    echo Please run 'gcloud auth login' first.
    pause
    exit /b 1
)

REM 3. Auto-detect Current Project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set CURRENT_PROJECT=%%i

if "%CURRENT_PROJECT%"=="" (
    echo [WARNING] No active project selected.
    set /p PROJECT_ID="Enter your Google Cloud Project ID: "
) else (
    echo [INFO] Using current project: %CURRENT_PROJECT%
    set PROJECT_ID=%CURRENT_PROJECT%
)

if "%PROJECT_ID%"=="" (
    echo [ERROR] Project ID is required.
    pause
    exit /b 1
)

REM Ensure project is set
call gcloud config set project %PROJECT_ID% >nul 2>nul

REM 4. Setup Variables
set SERVICE_NAME=idea-socdia-frontend
set REGION=asia-southeast1

REM 5. Verify BACKEND_URL from .env
set BACKEND_URL=
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if "%%A"=="BACKEND_URL" set BACKEND_URL=%%B
    )
)

if "%BACKEND_URL%"=="" (
    echo.
    echo [ERROR] BACKEND_URL not found in .env file!
    echo [ACTION] Please deploy the Backend first, copy the URL, and add it to .env like:
    echo BACKEND_URL=https://your-backend-service.a.run.app
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Ready to Deploy Frontend:
echo Project: %PROJECT_ID%
echo Service: %SERVICE_NAME%
echo Backend: %BACKEND_URL%
echo ==========================================
echo.
pause

echo [INFO] Deploying Frontend to Cloud Run...
echo [INFO] This may take a moment...
echo.

call gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars="BACKEND_URL=%BACKEND_URL%"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Deployment failed.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [SUCCESS] Frontend Deployed Successfully!
echo ==========================================
pause
exit /b 0