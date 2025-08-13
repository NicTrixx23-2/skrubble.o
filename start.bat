@echo off
echo Starting Skrubble.o Backend and Frontend...
echo.

echo Starting backend server...
start "Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak > nul

echo Starting frontend development server...
start "Frontend" cmd /k "cd /d %~dp0skrubble_o && npm run dev"

echo.
echo Both servers are starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
