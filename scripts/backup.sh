#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_NAME="${DB_NAME:-pacemaker}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

if [ -z "${DATABASE_URL:-}" ]; then
  error "DATABASE_URL environment variable is not set"
  exit 1
fi

DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*mysql:\/\/[^:]*:[^@]*@\([^:]*\).*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*mysql:\/\/[^:]*:[^@]*@[^:]*:\([0-9]*\).*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*mysql:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*mysql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME_PARAM=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME_PARAM="${DB_NAME_PARAM:-$DB_NAME}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME_PARAM}_${TIMESTAMP}.sql"
BACKUP_GZ="${BACKUP_FILE}.gz"

log "Starting backup of database: $DB_NAME_PARAM"

mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --skip-lock-tables \
  "$DB_NAME_PARAM" > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
log "Backup created: $BACKUP_GZ"

if [ "$1" == "--s3" ] && [ -n "${S3_BUCKET:-}" ]; then
  if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed"
    exit 1
  fi
  S3_PATH="${S3_PREFIX:-backups}/${DB_NAME_PARAM}_${TIMESTAMP}.sql.gz"
  aws s3 cp "$BACKUP_GZ" "s3://${S3_BUCKET}/${S3_PATH}"
  log "Uploaded to S3: s3://${S3_BUCKET}/${S3_PATH}"
fi

if [ "$1" == "--gcs" ] && [ -n "${GCS_BUCKET:-}" ]; then
  if ! command -v gsutil &> /dev/null; then
    error "gsutil is not installed"
    exit 1
  fi
  GCS_PATH="${GCS_PREFIX:-backups}/${DB_NAME_PARAM}_${TIMESTAMP}.sql.gz"
  gsutil cp "$BACKUP_GZ" "gs://${GCS_BUCKET}/${GCS_PATH}"
  log "Uploaded to GCS: gs://${GCS_BUCKET}/${GCS_PATH}"
fi

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
log "Cleaned up backups older than $RETENTION_DAYS days"

log "Backup completed successfully"
echo ""
echo "Summary:"
echo "  Backup file: $BACKUP_GZ"
echo "  File size: $(du -h "$BACKUP_GZ" | cut -f1)"
echo "  Total backups: $(find "$BACKUP_DIR" -name '*.sql.gz' | wc -l)"
echo "  Directory size: $(du -sh "$BACKUP_DIR" | cut -f1)"
