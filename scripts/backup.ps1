param(
  [switch]$S3,
  [switch]$GCS,
  [int]$RetentionDays = 14,
  [string]$BackupDir = ".\backups",
  [string]$S3Bucket = "",
  [string]$S3Prefix = "backups",
  [string]$GCSBucket = "",
  [string]$GCSPrefix = "backups"
)

function Write-Log {
  param([string]$Message, [string]$Color = "Green")
  Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" -ForegroundColor $Color
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
  Write-Log "DATABASE_URL environment variable is not set" -Color "Red"
  exit 1
}

$uri = [System.Uri]$dbUrl
$userInfo = $uri.UserInfo -split ':'
$dbUser = $userInfo[0]
$dbPass = $userInfo[1]
$dbHost = $uri.Host
$dbPort = $uri.Port
$dbName = $uri.AbsolutePath.TrimStart('/') -replace '\?.*$', ''

if (-not $dbPort) { $dbPort = 3306 }
if (-not $dbName) { $dbName = "pacemaker" }

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = Join-Path $BackupDir "${dbName}_${timestamp}.sql"
$backupGz = "${backupFile}.gz"

Write-Log "Starting backup of database: $dbName"

$env:MYSQL_PWD = $dbPass
mysqldump --host=$dbHost --port=$dbPort --user=$dbUser `
  --single-transaction --routines --triggers --events `
  --hex-blob --skip-lock-tables $dbName > $backupFile

if ($LASTEXITCODE -ne 0) {
  Write-Log "mysqldump failed with exit code $LASTEXITCODE" -Color "Red"
  exit 1
}

Compress-Archive -Path $backupFile -DestinationPath "${backupFile}.zip" -Force
Remove-Item $backupFile -Force
Write-Log "Backup created: ${backupFile}.zip"

if ($S3 -and $S3Bucket) {
  try {
    aws s3 cp "${backupFile}.zip" "s3://${S3Bucket}/${S3Prefix}/${dbName}_${timestamp}.zip"
    Write-Log "Uploaded to S3: s3://${S3Bucket}/${S3Prefix}/${dbName}_${timestamp}.zip"
  } catch {
    Write-Log "S3 upload failed: $_" -Color "Red"
  }
}

if ($GCS -and $GCSBucket) {
  try {
    gsutil cp "${backupFile}.zip" "gs://${GCSBucket}/${GCSPrefix}/${dbName}_${timestamp}.zip"
    Write-Log "Uploaded to GCS: gs://${GCSBucket}/${GCSPrefix}/${dbName}_${timestamp}.zip"
  } catch {
    Write-Log "GCS upload failed: $_" -Color "Red"
  }
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Log "Cleaned up backups older than $RetentionDays days"

Write-Log "Backup completed successfully" -Color "Green"
Write-Host "`nSummary:"
Write-Host "  Backup file: ${backupFile}.zip"
Write-Host "  Total backups: $(@(Get-ChildItem -Path $BackupDir -Filter '*.zip').Count)"
$dirSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "  Directory size: $('{0:N2}' -f ($dirSize / 1MB)) MB"
