#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="/srv/webberick/app"
VENV="/srv/webberick/venv"
as_root() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }

[ -d /srv/webberick ] || { echo "Run setup-production.sh first." >&2; exit 1; }
cd "$ROOT_DIR"
if [ "${SKIP_GIT_PULL:-no}" != "yes" ]; then git pull --ff-only; fi
as_root rsync -a --exclude node_modules --exclude dist --exclude .git --exclude .env --exclude dev-data --exclude media --exclude imported-sites --exclude backups "$ROOT_DIR/" "$APP_ROOT/"
as_root "$VENV/bin/pip" install -r "$APP_ROOT/requirements.txt"
as_root npm --prefix "$APP_ROOT" ci --no-fund
echo "Running npm audit (all installed dependencies)..."
as_root npm --prefix "$APP_ROOT" audit --audit-level=low
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" check --deploy
as_root npm --prefix "$APP_ROOT" run build
as_root rsync -a --delete "$APP_ROOT/dist/" /srv/webberick/www/
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" migrate --noinput
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" collectstatic --noinput
as_root systemctl restart webberick-gunicorn
as_root nginx -t
as_root systemctl reload nginx
curl --fail --silent --show-error http://127.0.0.1:8000/api/health/ >/dev/null
printf '%s\n' "Production deployment completed."
