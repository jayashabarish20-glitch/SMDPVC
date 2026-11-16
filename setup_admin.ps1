# Quick Admin Setup Script for SMDPVC

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "SMDPVC Admin Credentials Setup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for admin details
$email = Read-Host "Enter admin email (e.g., admin@smdpvc.school)"
$password = Read-Host "Enter admin password" -AsSecureString
$password_plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($password))
$username = Read-Host "Enter admin username (default: admin)"

if ($username -eq "") {
    $username = "admin"
}

# Validate email
if (-not ($email -match "@")) {
    Write-Host "ERROR: Invalid email address" -ForegroundColor Red
    exit 1
}

# Validate password
if ($password_plain.Length -lt 6) {
    Write-Host "ERROR: Password too short (minimum 6 characters)" -ForegroundColor Red
    exit 1
}

# Read current .env
$envPath = "$PSScriptRoot\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

# Update .env
$content = Get-Content $envPath
$content = $content -replace '^ADMIN_EMAIL=.*', "ADMIN_EMAIL=$email"
$content = $content -replace '^ADMIN_PASSWORD=.*', "ADMIN_PASSWORD=$password_plain"
$content = $content -replace '^ADMIN_USERNAME=.*', "ADMIN_USERNAME=$username"

# Save .env
Set-Content -Path $envPath -Value $content

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "✓ Admin credentials updated successfully!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration updated:" -ForegroundColor Yellow
Write-Host "  Email:    $email" -ForegroundColor Yellow
Write-Host "  Username: $username" -ForegroundColor Yellow
Write-Host "  Password: $('*' * $password_plain.Length)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend: cd backend"
Write-Host "  2. Run: python -m uvicorn app.main:app --reload"
Write-Host "  3. Admin account will be created automatically"
Write-Host ""
