#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$ROOT_DIR/.venv"
mkdir -p "$ROOT_DIR/dev-data/media" "$ROOT_DIR/dev-data/imported-sites"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -r "$ROOT_DIR/requirements.txt"
npm --prefix "$ROOT_DIR" ci --no-fund
export DJANGO_DEBUG=True
export WEBBERICK_ENV_FILE=/dev/null
export DATABASE_NAME=""
export MEDIA_ROOT="$ROOT_DIR/dev-data/media"
export IMPORT_ROOT="$ROOT_DIR/dev-data/imported-sites"
export DJANGO_EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
export DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
export CSRF_TRUSTED_ORIGINS=http://localhost:8090,http://127.0.0.1:8090,http://127.0.0.1:8091
"$VENV/bin/python" "$ROOT_DIR/backend/manage.py" migrate
printf '%s\n' "Development environment ready. Start Django with:"
printf '%s\n' "  source .venv/bin/activate && python backend/manage.py runserver 127.0.0.1:8000"
printf '%s\n' "Start Vite separately with: npm run dev"
