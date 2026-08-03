# Convert PNG to ICO and copy to project folder
# Run this script ONCE after create-shortcut.ps1 if you want the custom icon

$ArtifactIconPath = "$env:USERPROFILE\.gemini\antigravity\brain\935cfa61-0733-4b60-babc-54d0e72fbfd0\app_icon_1785537306213.png"
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DestIco = Join-Path $AppDir "app-icon.ico"

# Use .NET to create a basic ICO from the PNG
Add-Type -AssemblyName System.Drawing

if (Test-Path $ArtifactIconPath) {
    try {
        $png = [System.Drawing.Image]::FromFile($ArtifactIconPath)
        $bitmap = New-Object System.Drawing.Bitmap(256, 256)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($png, 0, 0, 256, 256)
        $graphics.Dispose()
        $png.Dispose()

        # Write ICO file manually (ICO format: header + directory + image data)
        $ms = New-Object System.IO.MemoryStream
        $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngBytes = $ms.ToArray()
        $ms.Dispose()
        $bitmap.Dispose()

        # ICO file structure
        $icoStream = New-Object System.IO.FileStream($DestIco, [System.IO.FileMode]::Create)
        $writer = New-Object System.IO.BinaryWriter($icoStream)

        # ICO Header: reserved=0, type=1 (icon), count=1
        $writer.Write([uint16]0)   # reserved
        $writer.Write([uint16]1)   # type = icon
        $writer.Write([uint16]1)   # count = 1 image

        # Image directory entry
        $writer.Write([byte]0)     # width  = 256 (0 means 256)
        $writer.Write([byte]0)     # height = 256 (0 means 256)
        $writer.Write([byte]0)     # color count
        $writer.Write([byte]0)     # reserved
        $writer.Write([uint16]1)   # color planes
        $writer.Write([uint16]32)  # bits per pixel
        $writer.Write([uint32]$pngBytes.Length)  # size of image data
        $writer.Write([uint32]22)  # offset to image data (6 header + 16 dir entry)

        # Write PNG image data
        $writer.Write($pngBytes)
        $writer.Flush()
        $icoStream.Close()

        Write-Host "[OK] Icon created at: $DestIco" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not create icon: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[INFO] Source PNG not found at: $ArtifactIconPath" -ForegroundColor Yellow
    Write-Host "[INFO] Skipping icon creation. Default icon will be used." -ForegroundColor Yellow
}
