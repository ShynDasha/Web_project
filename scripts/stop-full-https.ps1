$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PidDir = Join-Path $RootDir "run"

if (-not (Test-Path $PidDir)) {
    Write-Host "No running services found."
    exit 0
}

$pidFiles = Get-ChildItem -Path $PidDir -Filter *.pid -ErrorAction SilentlyContinue

if (-not $pidFiles) {
    Write-Host "No running services found."
    exit 0
}

foreach ($pidFile in $pidFiles) {
    $pid = Get-Content $pidFile.FullName
    $name = [System.IO.Path]::GetFileNameWithoutExtension($pidFile.Name)
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue

    if ($process) {
        Stop-Process -Id $pid -Force
        Write-Host "Stopped $name (PID $pid)"
    } else {
        Write-Host "$name was not running"
    }

    Remove-Item $pidFile.FullName -Force
}

Write-Host "All tracked services are stopped."
