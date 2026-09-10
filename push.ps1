<#
.SYNOPSIS
  One-line git add/commit/push for the Bookkeeply repo.

.USAGE
  From this folder, in PowerShell:
    .\push.ps1 "your commit message"

  If you omit the message, a timestamped default is used:
    .\push.ps1
#>

param(
    [string]$Message = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

# Always run from the folder this script lives in, regardless of where it's invoked from.
Set-Location -Path $PSScriptRoot

Write-Host "==> Checking for changes..." -ForegroundColor Cyan
$status = git status --porcelain
if (-not $status) {
    Write-Host "Nothing to commit - working tree is clean." -ForegroundColor Yellow
    exit 0
}

Write-Host "==> Staging all changes..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "git add failed - stopping." -ForegroundColor Red
    exit 1
}

Write-Host "==> Committing: $Message" -ForegroundColor Cyan
git commit -m "$Message"
if ($LASTEXITCODE -ne 0) {
    Write-Host "git commit failed - stopping." -ForegroundColor Red
    exit 1
}

Write-Host "==> Pushing..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "git push failed. If this is a new branch, try:" -ForegroundColor Red
    $branch = git branch --show-current
    Write-Host "    git push -u origin $branch" -ForegroundColor Red
    exit 1
}

Write-Host "==> Done. Pushed to GitHub - Vercel should redeploy automatically in a minute or two." -ForegroundColor Green
