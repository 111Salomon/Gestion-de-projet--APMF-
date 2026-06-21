@echo off
setlocal
set REPO_DIR=S:\\informatique\\Gestion de projet

start "" powershell -NoExit -Command "Set-Location -LiteralPath '%REPO_DIR%\\backend'; . .\\venv\\Scripts\\Activate.ps1; $env:DJANGO_SETTINGS_MODULE='config.settings'; daphne -p 8000 config.asgi:application"

start "" powershell -NoExit -Command "Set-Location -LiteralPath '%REPO_DIR%\\frontend'; npm run dev"

endlocal
