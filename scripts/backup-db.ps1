<#
.SYNOPSIS
    Pacemaker Institute - MySQL backup script (Windows PowerShell)

.DESCRIPTION
    Creates a timestamped .sql dump and optionally uploads to AWS S3.

.EXAMPLE
    .\scripts\backup-db.ps1
    .\scripts\backup-db.ps1 -Target s3
#>
[CmdletBinding()]
param(
    [ValidateSet('local','s3')]
    [string]$Target = 'local'
)

$ErrorActionPreference = 'Stop'
Set-Location -Path (Join-Path $PSScriptRoot '..')

# Load .env if present
if (Test-Path -LiteralPath '.env') {
    Get-Content '.env' | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

if (-not $env:DATABASE_URL) {
    Write-Error 'DATABASE_URL is not set.'
    exit 1
}

# Parse mysql://user:pass@host:port/db
if ($env:DATABASE_URL -notmatch '^mysql://([^:]+):([^@]+)@([^:/]+):?(\d*)/(.+)$') {
    Write-Error 'Cannot parse DATABASE_URL. Expected mysql://user:pass@host:port/db'
    exit 1
}
$dbUser   = $matches[1]
$dbPass   = $matches[2]
$dbHost   = $matches[3]
$dbPort   = if ($matches[4]) { [int]$matches[4] } else { 3306 }
$dbName   = $matches[5]

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = 'backups'
$outFile = Join-Path $outDir "pacemaker-$ts.sql.gz"

if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Write-Host "==> Dumping database '$dbName' from ${dbHost}:${dbPort}..."

$env:MYSQL_PWD = $dbPass
$dumpCmd = "mysqldump --user=`"$dbUser`" --host=`"$dbHost`" --port=$dbPort --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 `"$dbName`" | gzip > `"$outFile`""
cmd /c $dumpCmd
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

if (-not (Test-Path -LiteralPath $outFile) -or (Get-Item $outFile).Length -eq 0) {
    Write-Error 'mysqldump produced an empty file.'
    exit 1
}

Write-Host "==> Backup created: $outFile"
Write-Host "    Size: $("{0:N2}" -f ((Get-Item $outFile).Length / 1MB)) MB"

if ($Target -eq 's3') {
    if (-not $env:AWS_S3_BUCKET) {
        Write-Error 'BACKUP_TARGET=s3 requires AWS_S3_BUCKET.'
        exit 1
    }
    $region = if ($env:AWS_REGION) { $env:AWS_REGION } else { 'us-east-1' }
    Write-Host "==> Uploading to s3://$($env:AWS_S3_BUCKET)/db-backups/..."
    aws s3 cp $outFile "s3://$($env:AWS_S3_BUCKET)/db-backups/$(Split-Path $outFile -Leaf)" --region $region
    Write-Host "==> Upload complete."
}

# Retention: keep last 14 local backups
Write-Host '==> Pruning local backups older than 14 days...'
Get-ChildItem -Path $outDir -Filter 'pacemaker-*.sql.gz' -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
    Remove-Item -Force

Write-Host '==> Done.'
