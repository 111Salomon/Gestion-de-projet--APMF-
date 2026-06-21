param(
    [string]$ShortcutName = "Lancer_Gestion_Projet.lnk",
    [string]$IconPath = "",
    [string]$IconName = "Logo.ico"
)

$WshShell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$scriptPath = Split-Path -Parent (Resolve-Path -LiteralPath $MyInvocation.MyCommand.Definition)
$target = Join-Path -Path $scriptPath -ChildPath 'launch_app.bat'
$repoRoot = Split-Path -Parent $scriptPath
$iconsDir = Join-Path -Path $repoRoot -ChildPath 'assets\icons'

# Ensure icons directory exists
if (-not (Test-Path -Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

# Determine icon path priority:
# 1. explicit -IconPath
# 2. assets/icons/<IconName>
# 3. repo root Logo.ico -> copy into assets/icons and use it
if ($IconPath -eq "") {
    $candidateInIcons = Join-Path -Path $iconsDir -ChildPath $IconName
    $defaultLogo = Join-Path -Path $repoRoot -ChildPath 'Logo.ico'
    if (Test-Path -Path $candidateInIcons) {
        $IconPath = $candidateInIcons
    }
    elseif (Test-Path -Path $defaultLogo) {
        # copy root logo into icons dir if not already there
        $dest = Join-Path -Path $iconsDir -ChildPath 'Logo.ico'
        if (-not (Test-Path -Path $dest)) {
            Copy-Item -LiteralPath $defaultLogo -Destination $dest -Force
        }
        $IconPath = $dest
    }
}
$shortcutPath = Join-Path -Path $desktop -ChildPath $ShortcutName

if (-not (Test-Path -Path $target)) {
    Write-Error "Launcher not found: $target"
    exit 1
}

$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $scriptPath

if ($IconPath -ne "") {
    if (-not (Test-Path -Path $IconPath)) {
        Write-Error "Icon not found: $IconPath"
        exit 1
    }
    $ext = [IO.Path]::GetExtension($IconPath).ToLower()
    if ($ext -eq '.ico') {
        $fullIconPath = (Resolve-Path -LiteralPath $IconPath).ProviderPath
        $shortcut.IconLocation = $fullIconPath
    }
    else {
        Write-Warning "Only .ico files are supported for IconPath. Convert your image to .ico (eg. with ImageMagick: `magick convert img.png -resize 256x256 icon.ico`). Falling back to default icon."
        $shortcut.IconLocation = "$target,0"
    }
}
else {
    $shortcut.IconLocation = "$target,0"
}

$shortcut.Save()

Write-Output "Raccourci créé : $shortcutPath"
