@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node.js 22 and try again.& pause & exit /b 1)
if not exist node_modules call npm install
call npm run cap:sync || goto :error
cd android
call gradlew.bat assembleDebug || goto :error
echo.
echo APK created at:
echo %CD%\app\build\outputs\apk\debug\app-debug.apk
pause
exit /b 0
:error
echo.
echo Build failed. Open the android folder in Android Studio and confirm SDK 36 and JDK 21 are installed.
pause
exit /b 1
