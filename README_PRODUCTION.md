# Production Notes

Use `setup-production.sh` once on the Ubuntu EC2 host and `deploy-production.sh` for later
application updates. `setup-dev.sh` is local-only and keeps the existing Vite port `8090`.

The root application is the only project deployed. `solrasa_v1/` and `craft-boutique-online/`
remain separate nested projects and are not executed by the production scripts.

## October 2026 dependency repair

The deployment logs at `b5b2bb8` and `73ddc5a` stopped at the npm audit gate.
The fix on `feat/webberick-redesign` removes unused Firebase (previous patch),
`@tailwindcss/typography`, and `lovable-tagger`, then migrates Tailwind 3 to 4
with `@tailwindcss/postcss`. Autoprefixer is superseded by that integration.
`tailwind-merge` is updated for Tailwind 4; the existing animation plugin,
HSL palette, radii, and keyframes are retained. Shared compatibility CSS preserves
older shadows, blur, placeholders, and focus outlines. No force or overrides are used.

### Exact original dependency paths

- Tailwind 3 → chokidar → braces 3.0.3.
- Tailwind 3 → fast-glob → micromatch → braces 3.0.3.
- Tailwind 3 → micromatch → braces 3.0.3.
- Tailwind 3 → postcss-selector-parser 6.1.4.
- Tailwind 3 → postcss-nested → postcss-selector-parser 6.1.4.
- Unused typography plugin → postcss-selector-parser 6.0.10.
- Unused lovable-tagger and tailwindcss-animate retained Tailwind 3 through their dependencies/peers.

The repaired root tree has Tailwind 4.3.3 and neither vulnerable package.
`npm ci`, `npm audit --audit-level=low`, and the production build pass locally;
the audit reports **0 vulnerabilities**. All four existing tests pass, including
three-click admin navigation. The homepage test now mounts its required theme
provider, and jest-dom imports its Vitest integration. The build retains its
large JavaScript chunk warning. Existing unrelated lint errors in AdminHub and
UI type declarations are outside this dependency repair.

### Compatibility and server validation

Use Node 22 LTS at 22.12 or newer, or Node 24 (checked with Node 22.23.1). There is no need to
upgrade npm to resolve these findings. Tailwind 4 requires Safari 16.4+, Chrome
111+, and Firefox 128+; see https://tailwindcss.com/docs/compatibility .
Older browser support is the main compatibility change.

After this patch is committed and pushed to `feat/webberick-redesign`, validate
in a disposable checkout on the server as `ubuntu`, without sudo:

```bash
cd ~/Portfolio_ricky
git fetch origin
review_dir=$(mktemp -d /tmp/webberick-dependency-review.XXXXXX)
git archive origin/feat/webberick-redesign | tar -x -C "$review_dir"
cd "$review_dir"
node --version
npm ci --no-fund
npm audit --audit-level=low
npm run build
npm test
```

These commands do not publish assets, run Django commands, or restart services.
The dependency repair requires no Django, database, authentication, nginx, API
URL, environment variable, or migration changes. No deployment or merge into
main was performed. Keep the existing deployment audit gate enabled.
