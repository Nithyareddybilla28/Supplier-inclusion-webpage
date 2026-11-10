@echo off
setlocal enabledelayedexpansion

echo.
echo Lenovo Supplier Diversity - Setup
echo ==================================
echo.

REM Check Python
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo OK: Python %PYTHON_VERSION%

REM Check Node
echo.
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 16+
    exit /b 1
)
for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
echo OK: Node.js %NODE_VERSION%

REM Setup Backend
echo.
echo Setting up Backend...
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
echo OK: Backend dependencies installed

REM Setup Frontend
echo.
echo Setting up Frontend...
npm install >nul 2>&1
echo OK: Frontend dependencies installed

REM Create .env if needed
if not exist ".env" (
    echo.
    echo Creating .env file...
    (
        echo SECRET_KEY=your-random-key-change-me
        echo ENVIRONMENT=development
        echo DATABASE_URL=sqlite:///./lenovo_suppliers.db
    ) > .env
    echo OK: .env created
)

REM Summary
echo.
echo ==================================
echo Setup Complete!
echo.
echo Next steps:
echo.
echo Backend:
echo   venv\Scripts\activate
echo   python -m uvicorn backend:app --reload
echo   - http://localhost:8000
echo.
echo Frontend (new terminal):
echo   npm run dev
echo   - http://localhost:3000
echo.
echo Then:
echo   1. Go to http://localhost:3000
echo   2. Register as Admin
echo   3. Invite a supplier
echo   4. Test the form!
echo.
pause
