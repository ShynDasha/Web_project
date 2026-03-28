$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CertDir = Join-Path $RootDir "certs"
$LogDir = Join-Path $RootDir "logs"
$PidDir = Join-Path $RootDir "run"

New-Item -ItemType Directory -Force -Path $CertDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $PidDir | Out-Null

$KeyPath = Join-Path $CertDir "localhost-key.pem"
$CertPath = Join-Path $CertDir "localhost.pem"

if (-not (Test-Path $KeyPath) -or -not (Test-Path $CertPath)) {
    Write-Host "Generating local TLS certificate..."
    & openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 365 `
        -keyout $KeyPath `
        -out $CertPath `
        -subj "/CN=localhost" | Out-Null
}

function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [hashtable]$EnvironmentVariables
    )

    $pidFile = Join-Path $PidDir "$Name.pid"
    $logFile = Join-Path $LogDir "$Name.log"

    if (Test-Path $pidFile) {
        $existingPid = Get-Content $pidFile
        $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProcess) {
            Write-Host "$Name is already running with PID $existingPid"
            return
        }
        Remove-Item $pidFile -Force
    }

    $envAssignments = ($EnvironmentVariables.GetEnumerator() | ForEach-Object {
        '$env:{0}="{1}"' -f $_.Key, $_.Value
    }) -join "; "

    $command = "$envAssignments; node server.js *> `"$logFile`""

    $process = Start-Process powershell `
        -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command `
        -WorkingDirectory $WorkingDirectory `
        -PassThru `
        -WindowStyle Hidden

    Set-Content -Path $pidFile -Value $process.Id
    Write-Host "Started $Name on PID $($process.Id)"
}

Start-ServiceProcess -Name "auth-service" -WorkingDirectory (Join-Path $RootDir "services\auth-service") -EnvironmentVariables @{
    ENABLE_HTTPS = "true"
    PORT = "4101"
}

Start-ServiceProcess -Name "product-service" -WorkingDirectory (Join-Path $RootDir "services\product-service") -EnvironmentVariables @{
    ENABLE_HTTPS = "true"
    PORT = "4102"
}

Start-ServiceProcess -Name "notification-service" -WorkingDirectory (Join-Path $RootDir "services\notification-service") -EnvironmentVariables @{
    ENABLE_HTTPS = "true"
    PORT = "4104"
}

Start-ServiceProcess -Name "order-service" -WorkingDirectory (Join-Path $RootDir "services\order-service") -EnvironmentVariables @{
    NODE_TLS_REJECT_UNAUTHORIZED = "0"
    ENABLE_HTTPS = "true"
    PORT = "4103"
    PRODUCT_SERVICE_URL = "https://localhost:4102"
    NOTIFICATION_SERVICE_URL = "https://localhost:4104"
}

Start-ServiceProcess -Name "api-gateway" -WorkingDirectory (Join-Path $RootDir "api-gateway") -EnvironmentVariables @{
    NODE_TLS_REJECT_UNAUTHORIZED = "0"
    ENABLE_HTTPS = "true"
    PORT = "4450"
    AUTH_SERVICE_URL = "https://localhost:4101"
    PRODUCT_SERVICE_URL = "https://localhost:4102"
    ORDER_SERVICE_URL = "https://localhost:4103"
}

Start-ServiceProcess -Name "frontend" -WorkingDirectory (Join-Path $RootDir "frontend") -EnvironmentVariables @{
    ENABLE_HTTPS = "true"
    PORT = "3443"
    API_GATEWAY_HTTPS_URL = "https://localhost:4450"
}

Write-Host ""
Write-Host "Application is starting."
Write-Host "Open: https://localhost:3443"
Write-Host "Logs: $LogDir"
Write-Host "Stop all services with: .\scripts\stop-full-https.ps1"
