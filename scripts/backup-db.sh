#!/usr/bin/env bash
#
# Pacemaker Institute - MySQL Backup Script
# -----------------------------------------
# Creates a timestamped .sql dump and optionally uploads to AWS S3.
#
# Usage:
#   ./scripts/backup-db.sh                    # Local backup only
#   BACKUP_TARGET=s3 ./scripts/backup-db.sh   # Backup + upload to S3
#
# Required env vars (or set in .env):
#   DATABASE_URL   - MySQL connection string (mysql://user:pass@host:port/db)
#   AWS_S3_BUCKET  - Required if BACKUP_TARGET=s3
#   AWS_REGION     - Required if BACKUP_TARGET=s3
#
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

TS=$(date +"%Y%m%d-%H%M%S")
OUT_DIR="backups"
OUT_FILE="${OUT_DIR}/pacemaker-${TS}.sql.gz"

mkdir -p "$OUT_DIR"

# mysql://user:pass@host:port/db  ->  parse
URL_REGEX='^mysql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/(.+)$'
if [[ $DATABASE_URL =~ $URL_REGEX ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]:-3306}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "ERROR: Cannot parse DATABASE_URL. Expected mysql://user:pass@host:port/db" >&2
  exit 1
fi

echo "==> Dumping database '${DB_NAME}' from ${DB_HOST}:${DB_PORT}..."
if ! mysqldump \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "$DB_NAME" | gzip > "$OUT_FILE"; then
  echo "ERROR: mysqldump failed." >&2
  exit 1
fi

echo "==> Backup created: ${OUT_FILE}"
echo "    Size: $(du -h "$OUT_FILE" | cut -f1)"

if [ "${BACKUP_TARGET:-local}" = "s3" ]; then
  if [ -z "${AWS_S3_BUCKET:-}" ]; then
    echo "ERROR: BACKUP_TARGET=s3 requires AWS_S3_BUCKET." >&2
    exit 1
  fi
  echo "==> Uploading to s3://${AWS_S3_BUCKET}/db-backups/..."
  aws s3 cp "$OUT_FILE" "s3://${AWS_S3_BUCKET}/db-backups/$(basename "$OUT_FILE")" \
    --region "${AWS_REGION:-us-east-1}"
  echo "==> Upload complete."
fi

# Retention: keep last 14 local backups
echo "==> Pruning local backups older than 14 days..."
find "$OUT_DIR" -name "pacemaker-*.sql.gz" -mtime +14 -delete || true

echo "==> Done."
