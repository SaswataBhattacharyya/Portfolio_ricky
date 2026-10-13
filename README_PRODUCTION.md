# Production Notes

Use `setup-production.sh` once on the Ubuntu EC2 host and `deploy-production.sh` for later
application updates. `setup-dev.sh` is local-only and keeps the existing Vite port `8090`.

The root application is the only project deployed. `solrasa_v1/` and `craft-boutique-online/`
remain separate nested projects and are not executed by the production scripts.

## October 2026 dependency audit failure

The deployment shown at commit `b5b2bb8` stopped at `npm audit --audit-level=low`.
Because the script uses `set -e`, it did not reach the frontend build, www sync,
migrations, portfolio import, or service restart. It did already copy source into
`/srv/webberick/app` and run dependency installation; that directory is not an
atomic release. The log alone does not establish the running backend's health.

The dependency patch removes Firebase (no application imports) and applies
compatible npm updates without `--force`. The audit fell from 22 findings to 10
(5 high, 5 moderate). The production build still emits the same assets:
`index-BQ9RomGk.css` and `index-Dyv1zIkj.js`.

Remaining findings originate in `braces` and `postcss-selector-parser` through
Tailwind and related packages. `braces` has no published patched version:
https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
The selector parser has a patch at 7.1.6, outside the installed v6 dependency
ranges: https://github.com/advisories/GHSA-rj75-hqrm-r3gf
Do not use `npm audit fix --force`, replace packages with incompatible overrides,
or bypass the deployment audit to make this patch deploy. The full audit still
fails. Removing the remaining dependency paths requires a separately validated
build-tool migration or a documented risk acceptance; neither is part of this
patch. `npm audit --omit=dev` also still reports findings because npm includes
build-tool peer dependencies; it is not a clean substitute for the current gate.

### Server: validate in a separate checkout first

After the reviewed dependency patch has been committed and pushed to
`feat/webberick-redesign`, run these commands as `ubuntu`, without sudo:

```bash
cd ~/Portfolio_ricky
git fetch origin
review_dir=$(mktemp -d /tmp/webberick-dependency-review.XXXXXX)
git archive origin/feat/webberick-redesign | tar -x -C "$review_dir"
cd "$review_dir"
npm ci --no-fund
npm run build
npm audit --audit-level=low
```

These commands do not write into `/srv/webberick`, run Django commands, restart
services, or publish a frontend. Until the remaining findings are resolved, the
last command is expected to fail. No database, Django, nginx, credentials, or API
URL changes are required for the dependency patch.

Once the full audit passes and UI compatibility is checked, the existing deploy
command can be used. Back up the current frontend as well as database/media first:

```bash
cd ~/Portfolio_ricky
./backup-production.sh
frontend_backup="/srv/webberick/backups/frontend-$(date -u +%Y%m%d-%H%M%S).tar.gz"
sudo tar -czf "$frontend_backup" -C /srv/webberick/www .
sudo chmod 600 "$frontend_backup"
printf 'Frontend backup: %s\n' "$frontend_backup"
./deploy-production.sh
```

The standard deploy script performs migrations and restarts the backend as usual;
the dependency patch does not add any migrations. If only the frontend needs
rollback, restore the recorded frontend backup into `/srv/webberick/www` using
`sudo tar -xzf "$frontend_backup" -C /srv/webberick/www`. This restores the old
index and its matching assets without changing the database. Backend rollback is
a separate operation; do not restore the database for an npm audit failure.
