#!/usr/bin/env bash
set -Eeuo pipefail
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="/srv/webberick/backups/$STAMP"
as_root() { if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi; }
as_user() { local user="$1"; shift; if [ "$(id -u)" -eq 0 ]; then runuser -u "$user" -- "$@"; else sudo -u "$user" "$@"; fi; }
as_root mkdir -p "$DEST"
as_user postgres pg_dump webberick | as_root tee "$DEST/webberick.sql" >/dev/null
as_root tar -czf "$DEST/media.tar.gz" -C /srv/webberick media imported-sites
as_root chmod -R go-rwx "$DEST"
printf '%s\n' "Backup created at $DEST"
