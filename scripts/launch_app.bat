@echo off
setlocal
set REPO_DIR=S:\\informatique\\Gestion de projet


start "" powershell -NoExit -Command "Set-Location -LiteralPath '%REPO_DIR%\\backend'; . .\\venv\\Scripts\\Activate.ps1; $env:DJANGO_SETTINGS_MODULE='config.settings'; daphne -p 8000 config.asgi:application"

start "" powershell -NoExit -Command "Set-Location -LiteralPath '%REPO_DIR%\\frontend'; npm run dev"

rem Wait for frontend to be available and open default browser
start "" powershell -NoExit -Command "for ($i=0; $i -lt 120; $i++) { try { Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:5173'; break } catch { Start-Sleep -Seconds 1 } }"

endlocal
