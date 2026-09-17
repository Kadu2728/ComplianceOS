#!/bin/sh
# Compliance OS API container entrypoint.
#
# No arguments: migrate, seed the versioned content, serve. With arguments (a cron job such as
# `python scripts/send_reminders.py`): run them as-is — jobs never migrate.
set -eu

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

echo "[entrypoint] applying migrations"
alembic upgrade head
echo "[entrypoint] seeding versioned content"
python scripts/seed_content.py
echo "[entrypoint] starting api on port ${PORT:-8000} (workers=${WEB_CONCURRENCY:-1})"
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --proxy-headers \
  --forwarded-allow-ips="*" \
  --no-server-header
