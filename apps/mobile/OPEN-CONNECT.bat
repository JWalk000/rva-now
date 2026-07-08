@echo off
cd /d "%~dp0"
echo.
echo Opening connect page...
echo If Expo is not running, double-click START-EXPO.bat first.
echo.
start "" "%~dp0connect.html"
timeout /t 2 >nul
