# Package the markdown-to-pdf skill for distribution
# This script creates a ZIP file that can be shared with others

$skillName = "markdown-to-pdf"
$version = "1.0.0"
$outputFile = "markdown-to-pdf-skill-v$version.zip"

Write-Host "Packaging $skillName skill for distribution..." -ForegroundColor Cyan

# Files and folders to include
$includes = @(
    "SKILL.md",
    "README.md",
    "config-template.json",
    ".skillignore",
    "reference",
    "scripts",
    "dist",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "src"
)

# Create temporary directory
$tempDir = "temp-$skillName-package"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path "$tempDir/$skillName" | Out-Null

# Copy files
foreach ($item in $includes) {
    if (Test-Path $item) {
        Write-Host "  Including: $item" -ForegroundColor Green
        Copy-Item -Path $item -Destination "$tempDir/$skillName/" -Recurse -Force
    } else {
        Write-Host "  Skipping (not found): $item" -ForegroundColor Yellow
    }
}

# Create ZIP
Write-Host "`nCreating ZIP file..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir/$skillName" -DestinationPath $outputFile -Force

# Cleanup
Remove-Item -Recurse -Force $tempDir

# Display results
$fileSize = (Get-Item $outputFile).Length / 1MB
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "File: $outputFile"
Write-Host "Size: $([math]::Round($fileSize, 2)) MB"
Write-Host "`nTo share:" -ForegroundColor Cyan
Write-Host "  1. Send this ZIP file via email/cloud storage"
Write-Host "  2. Recipient extracts to: C:\Users\TheirName\.claude\skills\"
Write-Host "  3. Recipient runs: npm install && npx playwright install chromium"
Write-Host "`nThe skill is ready to distribute!" -ForegroundColor Green
