# Production Notes

Use `setup-production.sh` once on the Ubuntu EC2 host and `deploy-production.sh` for later
application updates. `setup-dev.sh` is local-only and keeps the existing Vite port `8090`.

The root application is the only project deployed. `solrasa_v1/` and `craft-boutique-online/`
remain separate nested projects and are not executed by the production scripts.
