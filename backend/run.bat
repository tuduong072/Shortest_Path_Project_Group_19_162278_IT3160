@echo off
chcp 65001 >nul
echo ==========================================
echo   PATH FINDING SYSTEM
echo ==========================================
echo.

:: Check Python
python --version >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python not installed
    pause
    exit /b 1
)
echo OK: Python found

:: Check pip
pip --version >nul 2>nul
if errorlevel 1 (
    echo ERROR: pip not installed
    pause
    exit /b 1
)
echo OK: pip found

:: Install dependencies
echo.
echo Installing dependencies...
echo -------------------------

if exist requirements.txt (
    pip install -r requirements.txt
) else (
    echo WARNING: requirements.txt not found
    pip install flask flask-cors 
)

:: Check data folder
echo.
echo Checking data...
echo ----------------

if not exist data (
    mkdir data
    mkdir data\constraints
    echo Created data folder
) else (
    echo Data folder exists
)

:: Check for data files
set HAS_DATA=1

if not exist data\nodes.csv (
    echo WARNING: nodes.csv file not found
    set HAS_DATA=0
) else (
    echo Found nodes.csv
)

if not exist data\edges.csv (
    echo WARNING: edges.csv file not found
    set HAS_DATA=0
) else (
    echo Found edges.csv
)

:: Ask about data import
echo.
set /p IMPORT="Import data from CSV? (y/n): "
if /i "%IMPORT%"=="y" (
    if exist import_data.py (
        echo Importing data...
        python import_data.py
    ) else (
        echo WARNING: import_data.py not found
    )
)

:: Start server
echo.
echo ==========================================
echo   STARTING SERVER...
echo ==========================================
echo.
echo User interface: http://localhost:5000
echo Admin interface: http://localhost:5000/admin
echo.
echo Press Ctrl+C to stop server
echo ==========================================
echo.

:: Run app
if exist app.py (
    python app.py
) else (
    echo ERROR: app.py not found
    pause
    exit /b 1
)