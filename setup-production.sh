#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="/srv/webberick/app"
VENV="/srv/webberick/venv"
ENV_DIR="/etc/webberick"
ENV_FILE="$ENV_DIR/webberick.env"

as_root() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }
as_user() { local user="$1"; shift; if [ "$(id -u)" -eq 0 ]; then runuser -u "$user" -- "$@"; else sudo -u "$user" "$@"; fi; }
postgres_cmd() { if [ "$(id -u)" -eq 0 ]; then runuser -u postgres -- "$@"; else sudo -u postgres "$@"; fi; }
ask_secret() { local prompt="$1" value; read -r -s -p "$prompt" value < /dev/tty; printf '\n' > /dev/tty; printf '%s' "$value"; }

[ -f "$ROOT_DIR/package-lock.json" ] && [ -f "$ROOT_DIR/backend/manage.py" ] || {
  echo "Run this script from the complete Webberick repository." >&2
  exit 1
}

as_root apt-get update
as_root apt-get install -y ca-certificates curl git nginx postgresql postgresql-contrib \
  python3 python3-venv python3-dev build-essential libpq-dev openssl rsync certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'parseInt(process.versions.node)')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | as_root bash -
  as_root apt-get install -y nodejs
fi

as_root useradd --system --home /srv/webberick --shell /usr/sbin/nologin webberick 2>/dev/null || true
as_root mkdir -p "$APP_ROOT" /srv/webberick/www /srv/webberick/media /srv/webberick/imported-sites /srv/webberick/backups "$ENV_DIR"
as_root chown -R webberick:webberick /srv/webberick
as_root chmod 755 "$ENV_DIR"

if [ ! -f "$ENV_FILE" ]; then
  ADMIN_EMAIL="$(read -r -p 'Admin email: ' value < /dev/tty; printf '%s' "$value")"
  ADMIN_PASSWORD="$(ask_secret 'Admin password: ')"
  ADMIN_CONFIRM="$(ask_secret 'Confirm admin password: ')"
  [ "$ADMIN_PASSWORD" = "$ADMIN_CONFIRM" ] || { echo "Admin passwords do not match." >&2; exit 1; }
  GMAIL_ADDRESS="$(read -r -p 'Gmail SMTP address: ' value < /dev/tty; printf '%s' "$value")"
  GIG_RECEIVER_EMAIL="$(read -r -p 'Gig receiver address: ' value < /dev/tty; printf '%s' "$value")"
  GMAIL_APP_PASSWORD="$(ask_secret 'Gmail App Password: ')"
  GMAIL_CONFIRM="$(ask_secret 'Confirm Gmail App Password: ')"
  [ "$GMAIL_APP_PASSWORD" = "$GMAIL_CONFIRM" ] || { echo "Gmail App Passwords do not match." >&2; exit 1; }
  PUBLIC_CONTACT_EMAIL="$(read -r -p 'Public contact email: ' value < /dev/tty; printf '%s' "$value")"
  DB_PASSWORD="$(openssl rand -hex 30)"
  DJANGO_SECRET_KEY="$(openssl rand -hex 48)"
  VAPID_PUBLIC_KEY=""
  VAPID_PRIVATE_KEY=""
  postgres_cmd psql <<SQL
DO \\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'webberick') THEN
    CREATE ROLE webberick LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER ROLE webberick WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\\$\$;
SQL
  postgres_cmd psql -tc "SELECT 1 FROM pg_database WHERE datname = 'webberick'" | grep -q 1 || postgres_cmd createdb -O webberick webberick
  as_root tee "$ENV_FILE" >/dev/null <<EOF
DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=webberick.duckdns.org,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://webberick.duckdns.org,http://localhost:8090
DATABASE_NAME=webberick
DATABASE_USER=webberick
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
GMAIL_ADDRESS=$GMAIL_ADDRESS
GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD
GIG_RECEIVER_EMAIL=$GIG_RECEIVER_EMAIL
PUBLIC_CONTACT_EMAIL=$PUBLIC_CONTACT_EMAIL
VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
VAPID_CLAIM_EMAIL=mailto:$GMAIL_ADDRESS
MEDIA_ROOT=/srv/webberick/media
IMPORT_ROOT=/srv/webberick/imported-sites
STATIC_ROOT=/srv/webberick/app/backend/staticfiles
DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EOF
  as_root chmod 600 "$ENV_FILE"
  export BOOTSTRAP_ADMIN_EMAIL="$ADMIN_EMAIL" BOOTSTRAP_ADMIN_PASSWORD="$ADMIN_PASSWORD"
else
  echo "Existing environment preserved: $ENV_FILE"
fi

as_root rsync -a --exclude node_modules --exclude dist --exclude .git --exclude .env --exclude dev-data --exclude media --exclude imported-sites --exclude backups "$ROOT_DIR/" "$APP_ROOT/"
as_root chown -R webberick:webberick "$APP_ROOT"
as_root python3 -m venv "$VENV"
as_root "$VENV/bin/pip" install --upgrade pip
as_root "$VENV/bin/pip" install -r "$APP_ROOT/requirements.txt"
as_root env WEBBERICK_ENV_FILE="$ENV_FILE" "$VENV/bin/python" "$APP_ROOT/backend/manage.py" generate_vapid
as_root npm --prefix "$APP_ROOT" ci --no-fund
as_root npm --prefix "$APP_ROOT" run build
as_root rsync -a --delete "$APP_ROOT/dist/" /srv/webberick/www/
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" migrate --noinput
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" collectstatic --noinput
as_root "$VENV/bin/python" "$APP_ROOT/backend/manage.py" import_portfolio
if [ -n "${BOOTSTRAP_ADMIN_EMAIL:-}" ]; then
  as_user webberick env ADMIN_EMAIL="$BOOTSTRAP_ADMIN_EMAIL" ADMIN_PASSWORD="$BOOTSTRAP_ADMIN_PASSWORD" "$VENV/bin/python" "$APP_ROOT/backend/manage.py" bootstrap_admin_env
  unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
fi
as_root install -m 0644 "$APP_ROOT/deployment/systemd/webberick-gunicorn.service" /etc/systemd/system/webberick-gunicorn.service
as_root install -m 0644 "$APP_ROOT/deployment/nginx/webberick.conf" /etc/nginx/sites-available/webberick
as_root ln -sfn /etc/nginx/sites-available/webberick /etc/nginx/sites-enabled/webberick
as_root rm -f /etc/nginx/sites-enabled/default
as_root systemctl daemon-reload
as_root systemctl enable --now webberick-gunicorn
as_root nginx -t
as_root systemctl enable --now nginx
printf '%s\n' "Initial setup complete. HTTPS is intentionally not requested until DNS points to this host."
