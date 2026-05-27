<#
Register a Windows Scheduled Task to run the Django management command
`sync_project_archives` every hour.

Usage (from project root):
  powershell -ExecutionPolicy Bypass -File backend\scripts\register_sync_task.ps1

The script assumes the backend folder contains a virtualenv at `venv\Scripts\python.exe`.
#>

try {
    # Le script est placé dans backend/scripts, le dossier parent est le dossier backend
    $backendPath = Resolve-Path -Path (Join-Path $PSScriptRoot "..")
    if (-not (Test-Path $backendPath)) {
        Write-Error "Backend path not found: $backendPath"
        exit 1
    }

    $python = Join-Path $backendPath "venv\Scripts\python.exe"
    $manage = Join-Path $backendPath "manage.py"

    if (-not (Test-Path $python)) {
        Write-Error "Python executable not found at: $python`nPlease ensure the virtualenv is created.";
        exit 1
    }

    $taskName = "SyncProjectArchives"
    $args = "`"$manage`" sync_project_archives"

    $action = New-ScheduledTaskAction -Execute $python -Argument $args

    # Trigger: start 1 minute from now, repeat every 60 minutes indefinitely
    $startTime = (Get-Date).AddMinutes(1)
    $trigger = New-ScheduledTaskTrigger -Once -At $startTime -RepetitionInterval (New-TimeSpan -Minutes 60) -RepetitionDuration ([TimeSpan]::MaxValue)

    # Register task for current user
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Sync project archives (RG-29) every hour" -User $env:USERNAME -RunLevel Highest -Force

    Write-Host "Scheduled task '$taskName' registered. It will run hourly starting at $startTime." -ForegroundColor Green
    exit 0
}
catch {
    Write-Error "Failed to register scheduled task: $_"
    exit 1
}
