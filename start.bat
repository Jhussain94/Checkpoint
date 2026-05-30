@echo off
echo Starting H^&M Campus Server...
echo.

:: Try Python 3 first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Open your browser at: http://localhost:8000
    echo Press Ctrl+C to stop the server.
    echo.
    python -m http.server 8000
    goto :end
)

:: Try Python launcher
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Open your browser at: http://localhost:8000
    echo Press Ctrl+C to stop the server.
    echo.
    py -m http.server 8000
    goto :end
)

:: Try Node / npx
npx --version >nul 2>&1
if %errorlevel% == 0 (
    echo Open your browser at: http://localhost:8000
    echo Press Ctrl+C to stop the server.
    echo.
    npx serve . -p 8000
    goto :end
)

echo ERROR: Python or Node.js not found.
echo Please install Python from https://python.org and try again.
pause

:end
