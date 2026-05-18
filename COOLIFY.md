# Deploying condo on Coolify (evaluation only)

This fork of [open-condo-software/condo](https://github.com/open-condo-software/condo) is wired up for the simplest possible Coolify deploy: click "Deploy" and the stack comes up with no manual env-var configuration.

> ⚠️ **NOT FOR PRODUCTION.** The bootstrap reuses the local-dev `bin/prepare.js` script, which seeds **default admin credentials** (`admin@example.com` / `admin`), disables captcha, and leaves other dev-mode toggles enabled. Rotate everything in the **Rotate before public exposure** section below before exposing the URL beyond yourself.

## Deploy steps

1. In Coolify: **New Resource → Public Repository**.
2. Paste this fork's URL, set branch to `coolify-deploy`.
3. **Build Pack → Docker Compose**. Coolify picks up `docker-compose.yml` at the repo root automatically.
4. Coolify auto-generates values for `SERVICE_FQDN_CONDO_4006`, `SERVICE_PASSWORD_POSTGRES`, and `SERVICE_BASE64_64_COOKIE` from the compose file. Assign a domain if you want a custom one (otherwise Coolify provides a `*.sslip.io` URL).
5. **Deploy**.

Then open `https://<your-fqdn>/admin/signin` and log in with `admin@example.com` / `admin`.

## What runs

| Service    | Purpose                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `postgres` | Postgres 16.4. Internal only. Password from `SERVICE_PASSWORD_POSTGRES`. |
| `redis`    | Redis 6.2. Internal only.                                                |
| `init`     | One-shot. Creates the DB, runs migrations, seeds admin, then exits.      |
| `condo`    | Web server on port 4006. Public via `SERVICE_FQDN_CONDO_4006`.           |
| `worker`   | Background jobs (notifications, imports, exports). No ports.             |

## Rotate before public exposure

The init service hardcodes two values in `docker-compose.yml` that you MUST change before letting anyone else hit the URL:

```yaml
- DEFAULT_TEST_ADMIN_IDENTITY=admin@example.com
- DEFAULT_TEST_ADMIN_SECRET=admin
```

Change them in the Coolify UI's environment-variables panel (overrides the compose value) and redeploy. The cookie secret and DB password are already random (`SERVICE_BASE64_64_COOKIE`, `SERVICE_PASSWORD_POSTGRES`) — no action needed there.

## Known gotchas

- **First build is slow.** Expect 10–20 minutes. The Dockerfile builds the full monorepo (`yarn build` walks every workspace via Turborepo). Subsequent rebuilds without dependency changes are faster thanks to BuildKit cache mounts.
- **Web service races init on first boot.** `depends_on: service_completed_successfully` should prevent this, but if you see condo crash-loop with "database does not exist" or similar before init finishes, just hit **Restart** on the condo service in Coolify once init shows as exited.
- **S3 file uploads do not work** in this default config. `FILE_FIELD_ADAPTER=local` is the default, so uploads go to the container's ephemeral disk and are lost on redeploy. Configure an S3-compatible bucket and add the relevant env vars to enable persistent file storage.
- **Init exits cleanly, not "healthy".** Coolify's `exclude_from_hc: true` field is documented for one-shot services, but it fails strict `docker compose config` validation and so is intentionally not set in the YAML. If Coolify ever marks the init service as failed despite a clean exit, add `exclude_from_hc: true` manually in Coolify's compose-override editor for that service.
- **Workspaces beyond `@app/condo` are not deployed.** This compose deploys only the main condo app + its worker. Other apps in `apps/` (e.g. address-service, miniapp) are not wired up here. The condo app is configured to use `FAKE_ADDRESS_SERVICE_CLIENT=true`, so address autocomplete returns stub data.
- **Don't redeploy expecting fresh data.** The `postgres-data` and `redis-data` named volumes persist across redeploys. To wipe state, delete the volumes from Coolify's Storages tab.

## What's different from upstream

Three files diverge from upstream `open-condo-software/condo`:

- `docker-compose.yml` — rewritten for Coolify (no custom networks, internal-only DB/Redis, one-shot init service, magic env vars).
- `Dockerfile` — adds a small `pruner` stage that runs `bin/prune.sh` inside the build so Coolify (which has no pre-build hook) doesn't need a hand-run prune.
- `bin/prepare.js` — two-line change to let `LOCAL_PG_DB_PREFIX` and `LOCAL_REDIS_DB_PREFIX` be overridden via env vars, so the local-dev prepare script can reach Postgres/Redis at their Compose service names instead of `127.0.0.1`. Local development behavior is unchanged when those env vars are not set.

Nothing under `apps/` or `packages/` is modified.
