# Address Heuristics Migration Guide

This guide covers migrating your address-service database to the new heuristics-based address deduplication system.

## What Changed

1. **New `AddressHeuristic` model** — stores provider-generated identifiers (FIAS ID, coordinates, Google Place ID, fallback key) as separate DB records for cross-provider matching
2. **New `Address.possibleDuplicateOf` field** — flags addresses that may be duplicates of another address
3. **New `Address.key` format** — keys are now prefixed with heuristic type (e.g. `fias_id:<uuid>`, `fallback:<key>`)
4. **Removed `FIAS_PROVIDERS` constant** — provider-specific logic replaced by generic heuristic extraction
5. **Removed `generateAddressKeyFromFiasId()`** — FIAS logic now lives in provider `extractHeuristics()`

## Prerequisites

- **Node.js** 24.x (LTS)
- **Python** 3.x with `Django==5.2` and `psycopg2-binary==2.9.10`
- **PostgreSQL** 16.8
- **Back up your database** before proceeding

## Step-by-Step Migration

### 1. Pull latest code and install dependencies

```bash
git pull origin main
yarn install
yarn workspace @app/condo build:deps
```

### 2. Run database schema migration

This creates the `AddressHeuristic` table and adds `possibleDuplicateOf` to `Address`:

```bash
yarn workspace @app/address-service run migrate
```

### 3. Run Script A — Migrate Address.key format

First, preview changes with dry-run:

```bash
yarn workspace @app/address-service node bin/migrate-address-keys-to-heuristics.js --dry-run
```

Then apply:

```bash
yarn workspace @app/address-service node bin/migrate-address-keys-to-heuristics.js
```

This converts:
- `fias:<uuid>` → `fias_id:<uuid>`
- `россия~свердловская~...` → `fallback:россия~свердловская~...`

### 4. Run Script B — Create AddressHeuristic records

First, preview:

```bash
yarn workspace @app/address-service node bin/create-address-heuristics.js --dry-run
```

Then apply:

```bash
yarn workspace @app/address-service node bin/create-address-heuristics.js
```

This creates `AddressHeuristic` records from existing `Address.key` and `Address.meta.data` fields. Duplicate addresses will be flagged with `possibleDuplicateOf`.

### 5. (Optional) Run Script C — Merge duplicate addresses

This script runs **locally** and connects to condo + address-service as remote GraphQL clients.
See `apps/address-service/bin/local/README.md` for setup.

Preview merges:

```bash
source apps/address-service/bin/local/.env
node apps/address-service/bin/local/merge-duplicate-addresses.js --dry-run
```

Apply merges:

```bash
source apps/address-service/bin/local/.env
node apps/address-service/bin/local/merge-duplicate-addresses.js
```

This auto-merges clear duplicate cases. Ambiguous cases (both addresses referenced by condo Properties) are left for admin manual resolution via the admin UI.

## Verification

After migration, verify:

```sql
-- Check AddressHeuristic records were created
SELECT COUNT(*) FROM "AddressHeuristic" WHERE "deletedAt" IS NULL;

-- Check Address.key format was migrated
SELECT COUNT(*) FROM "Address" WHERE "deletedAt" IS NULL AND "key" NOT LIKE '%:%';
-- Should return 0 (all keys should have a type prefix)

-- Check for flagged duplicates
SELECT COUNT(*) FROM "Address" WHERE "deletedAt" IS NULL AND "possibleDuplicateOf" IS NOT NULL;
```

## Rollback

To revert the database schema migration:

```bash
yarn workspace @app/address-service run migrate:down
```

Note: Scripts A and B are idempotent — they can be safely re-run after a rollback and re-migration.

## Breaking Changes

| Change | Impact |
|--------|--------|
| `Address.key` format changed | Keys now prefixed with heuristic type (`fias_id:`, `fallback:`, etc.). Code that parses `Address.key` directly needs updating. |
| `FIAS_PROVIDERS` constant removed | Use `extractHeuristics()` on providers instead of checking provider membership. |
| `generateAddressKeyFromFiasId()` removed | FIAS key generation now handled by `DadataSearchProvider.extractHeuristics()` and `PullentiSearchProvider.extractHeuristics()`. |
| `generateAddressKey()` renamed to `generateFallbackKey()` | On `AbstractSearchProvider` and `InjectionsSeeker`. `generateAddressKey()` still exists but now delegates to `extractHeuristics()`. |
