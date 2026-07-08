@echo off
cd /d "%~dp0"
set CI=
set EXPO_OFFLINE=
echo.
echo ============================================
echo   RVA Now - Expo Go dev server
echo ============================================
echo.
echo When you see the login prompt:
echo   1. Press DOWN ARROW once
echo   2. Press ENTER to select "Proceed anonymously"
echo.
echo Then scan the QR code or use connect.html
echo.
npx expo start --tunnel --port 8081 --clear
pause
