#!/usr/bin/env bash
# Первичная выгрузка контента на сервер.
#   scripts/push-data.sh user@server                              — из локальной базы (после npm run seed) и папки media
#   scripts/push-data.sh user@server geobit.dump geobit-media.tgz  — из готовых файлов
# ВНИМАНИЕ: база на сервере будет ЗАМЕНЕНА.
set -euo pipefail
HOST=${1:?укажите user@server}
LOCAL_DB=${LOCAL_DB:-postgres://postgres@localhost:5432/geobit}
# база разработки создана в режиме push — помечаем, что схема соответствует миграциям проекта
MIGRATIONS=$(ls src/migrations/*.json | xargs -n1 basename | sed 's/\.json$//')
if [ -n "${2:-}" ]; then
  cp "$2" /tmp/geobit.dump; cp "${3:?нужен архив картинок}" /tmp/geobit-media.tgz
else
  pg_dump "$LOCAL_DB" --format=custom --no-owner --no-acl --exclude-table-data=leads --exclude-table-data=subscribers > /tmp/geobit.dump
  tar czf /tmp/geobit-media.tgz -C media .
fi
SQL="DELETE FROM payload_migrations WHERE batch = -1;"
for m in $MIGRATIONS; do SQL="$SQL INSERT INTO payload_migrations (name, batch, updated_at, created_at) SELECT '$m', 1, now(), now() WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name = '$m');"; done
scp /tmp/geobit.dump "$HOST":/tmp/geobit.dump
scp /tmp/geobit-media.tgz "$HOST":/tmp/geobit-media.tgz
ssh "$HOST" 'set -e; cd /opt/geobit
  docker compose stop app
  docker compose exec -T db pg_restore -U geobit -d geobit --clean --if-exists --no-owner < /tmp/geobit.dump
  docker compose exec -T db psql -U geobit -d geobit -c "'"$SQL"'"
  docker run --rm -v geobit_media:/m -v /tmp:/t alpine sh -c "tar xzf /t/geobit-media.tgz -C /m && chown -R 1001:1001 /m"
  docker compose start app
  rm /tmp/geobit.dump /tmp/geobit-media.tgz'
echo "Готово"
