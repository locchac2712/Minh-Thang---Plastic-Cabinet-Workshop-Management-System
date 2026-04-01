Function Kill-ProcessByPort($port) {
    Write-Host "Checking for existing process on port $port..."
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($process) {
        $pid = $process.OwningProcess
        Write-Host "Found process with PID $pid on port $port. Terminating..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "No process found on port $port."
    }
}

# Kill processes on default ports
Kill-ProcessByPort 8080
Kill-ProcessByPort 5173

Write-Host "------------------------------------"

# Start Backend
Write-Host "Starting Backend (Spring Boot)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; mvn spring-boot:run" -WindowStyle Normal

# Start Frontend
Write-Host "Starting Frontend (React/Vite)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "------------------------------------"
Write-Host "Both processes have been triggered in separate terminal windows."
Write-Host "Script complete."
