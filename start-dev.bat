@echo off
setlocal

cd /d "%~dp0"

echo [1/3] Dong tien trinh dang dung cong 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Khoi dong Backend...
if exist "%~dp0backend\.mvn\wrapper\maven-wrapper.properties" (
    start "Backend" /D "%~dp0backend" cmd /k "mvnw.cmd spring-boot:run"
) else if exist "C:\Program Files\Apache\apache-maven-3.9.13\bin\mvn.cmd" (
    start "Backend" /D "%~dp0backend" "C:\Program Files\Apache\apache-maven-3.9.13\bin\mvn.cmd" spring-boot:run
) else (
    echo Khong tim thay Maven Wrapper hoac Maven tai Program Files.
    echo Vui long cai Maven hoac them .mvn/wrapper cho backend.
)

echo [3/3] Khoi dong Frontend...
start "Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo Hoan tat. Backend va Frontend dang duoc khoi dong.
endlocal
