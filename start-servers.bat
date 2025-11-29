@echo off
echo Starting EventHub Application...
echo.

REM Start Backend Server
echo Starting Backend Server on port 5000...
start "EventHub Backend" powershell -NoExit -Command "cd '%~dp0backend'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm start"

REM Wait a few seconds for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend Server
echo Starting Frontend Server on port 3000...
start "EventHub Frontend" powershell -NoExit -Command "cd '%~dp0frontend\build'; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; http-server -p 3000 --proxy http://localhost:5000"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
