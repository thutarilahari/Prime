# Create Desktop Shortcut for Delta Learning Platform
# Run this script ONCE to set up the Desktop shortcut.
# Usage: Right-click this file -> "Run with PowerShell"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatFile = Join-Path $AppDir "Start-Learning-App.bat"
$IconFile = Join-Path $AppDir "app-icon.ico"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Delta Learning Platform.lnk"

# Check bat file exists
if (-not (Test-Path $BatFile)) {
    Write-Host "[ERROR] Start-Learning-App.bat not found in: $AppDir" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the project root." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host "   Delta Learning Platform - Shortcut Setup" -ForegroundColor Cyan
Write-Host "  =============================================" -ForegroundColor Cyan
Write-Host ""

# Create the shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $BatFile
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.Description = "Launch Delta Learning Platform (Frontend + Backend)"
$Shortcut.WindowStyle = 1  # Normal window

# Set icon if available
if (Test-Path $IconFile) {
    $Shortcut.IconLocation = "$IconFile, 0"
    Write-Host "  [OK] Custom icon set." -ForegroundColor Green
} else {
    # Fallback to cmd.exe icon
    $Shortcut.IconLocation = "cmd.exe, 0"
    Write-Host "  [INFO] app-icon.ico not found, using default icon." -ForegroundColor Yellow
}

$Shortcut.Save()

Write-Host "  [OK] Shortcut created at: $ShortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "  You can now double-click 'Delta Learning Platform' on your Desktop" -ForegroundColor Cyan
Write-Host "  to launch the app anytime!" -ForegroundColor Cyan
Write-Host ""
Read-Host "  Press Enter to close"
