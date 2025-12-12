@echo off
echo ==========================================
echo   Routing System - Hoang Liet
echo ==========================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed
    pause
    exit /b 1
)

echo Checking dependencies...
pip install -r requirements.txt

if not exist "..\\.env" (
    echo Error: .env file not found
    pause
    exit /b 1
)

echo.
echo Starting Flask server...
echo User interface: http://localhost:5000
echo Admin interface: http://localhost:5000/admin
echo.
echo Press Ctrl+C to stop
echo.

python app.py
pause
