Function Kill-ProcessByPort($port) {
    Write-Host "Checking for existing process on port $port..."
    # 1. Kill by Port
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId -gt 0) {
                Write-Host "Found process with PID $procId on port $port. Terminating..."
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "No process found on port $port."
    }
}

# Advanced Cleanup (Optional but helpful for Spring Boot)
Function Clean-JavaHanging() {
    Write-Host "Cleaning up any hanging Java processes on port 8080..."
    $javaProcs = Get-Process -Name java -ErrorAction SilentlyContinue
    foreach ($p in $javaProcs) {
        # Check if the process is using port 8080 or just kill all if it's the only java project
        # For safety, we rely on the port check but sometimes java hangs after port release.
        # Here we just rely on port-based kill which we already did.
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
