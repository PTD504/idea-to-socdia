@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Google Cloud Run Deployment Script
echo ==========================================
echo.

REM 1. Verify gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Google Cloud SDK ^(gcloud^) is not installed or not in your PATH.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM 2. Check authentication (Passive check only)
echo [INFO] Checking authentication status...
call gcloud auth print-access-token >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] You are not authenticated with Google Cloud.
    echo [ACTION REQUIRED] Please run the following command in your terminal manually, then re-run this script:
    echo.
    echo     gcloud auth login
    echo.
    pause
    exit /b 1
)

echo [INFO] Authenticated successfully.
echo.

REM 3. Prompt for Project ID
set /p PROJECT_ID="Enter your Google Cloud Project ID: "
if "%PROJECT_ID%"=="" (
    echo [ERROR] Project ID cannot be empty.
    pause
    exit /b 1
)

REM 4. Set the project
echo [INFO] Setting gcloud project to %PROJECT_ID%...
call gcloud config set project %PROJECT_ID%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to set project. Exiting...
    pause
    exit /b 1
)

REM 5. Prompt for Region
set REGION=asia-southeast1
set /p USER_REGION="Enter deployment region [default: %REGION%]: "
if not "%USER_REGION%"=="" set REGION=%USER_REGION%

REM 6. Service Name
set SERVICE_NAME=idea-socdia-backend

REM 7. Get GEMINI_API_KEY
set GEMINI_API_KEY=
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if "%%A"=="GEMINI_API_KEY" set GEMINI_API_KEY=%%B
    )
)

if "%GEMINI_API_KEY%"=="" (
    echo [WARNING] GEMINI_API_KEY not found in .env file.
    set /p GEMINI_API_KEY="Please enter your GEMINI_API_KEY securely now: "
)

if "%GEMINI_API_KEY%"=="" (
    echo [ERROR] GEMINI_API_KEY is required for deployment.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Ready to Deploy:
echo Project: %PROJECT_ID%
echo Region:  %REGION%
echo Service: %SERVICE_NAME%
echo ==========================================
echo.
pause

echo [INFO] Deploying to Google Cloud Run...
echo [INFO] This may take a few minutes (Building container + Deploying)...
echo.

REM Execute Deployment
call gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars="GEMINI_API_KEY=%GEMINI_API_KEY%"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Deployment failed. Please check the logs above.
    echo Common fixes:
    echo  - Enable Cloud Build API: gcloud services enable cloudbuild.googleapis.com
    echo  - Enable Cloud Run API:   gcloud services enable run.googleapis.com
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [SUCCESS] Deployment Completed!
echo ==========================================
pause
exit /b 0