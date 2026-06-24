@echo off
REM Learning Disability Detection System - Setup Script for Windows
REM ================================================================

echo.
echo ========================================
echo 🚀 LEARNING DISABILITY DETECTION SETUP
echo ========================================
echo.

REM Check Python
echo [Step 1] Checking Python...
python --version
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8 or higher
    exit /b 1
)
echo ✅ Python is available
echo.

REM Create virtual environment
echo [Step 2] Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat
echo ✅ Virtual environment created and activated
echo.

REM Install requirements
echo [Step 3] Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt
echo ✅ Dependencies installed
echo.

REM Train model
echo [Step 4] Training ML model...
echo This will take 30-60 seconds...
python train_model.py
if errorlevel 1 (
    echo ❌ Model training failed
    exit /b 1
)
echo ✅ Model trained
echo.

REM Summary
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start the API server:
echo    python main.py
echo.
echo 2. Open API documentation:
echo    http://localhost:8000/docs
echo.
echo 3. Run tests:
echo    python test_api.py
echo.
echo ========================================
echo.
