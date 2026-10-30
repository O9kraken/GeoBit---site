#!/usr/bin/env bash
# Ежедневный бэкап: дамп базы + архив картинок, храним 14 дней.
# cron (под root):  15 4 * * *  /opt/geobit/scripts/backup.sh >> /var/log/geobit-backup.log 2>&1
# Копия вне сервера: если настроен rclone (remote "s3"), архивы уходят ещё и в объектное хранилище.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=/opt/geobit/backups
STAMP=$(date +%F_%H%M)
mkdir -p "$DIR"
docker compose exec -T db pg_dump -U geobit -d geobit --format=custom > "$DIR/db_$STAMP.dump"
docker run --rm -v geobit_media:/m:ro -v "$DIR":/b alpine tar czf "/b/media_$STAMP.tgz" -C /m .
find "$DIR" -type f -mtime +14 -delete
if command -v rclone >/dev/null && rclone listremotes | grep -q '^s3:'; then
  rclone copy "$DIR" s3:geobit-backups --max-age 25h
fi
echo "$(date -Is) ok: $(du -sh "$DIR" | cut -f1)"
