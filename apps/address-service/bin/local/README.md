# Local scripts

Scripts in this directory are meant to be run **locally on your machine**, not on the server.
They connect to condo and address-service as remote GraphQL clients — no local keystone instance is needed.

## Setup

1. Copy `.env.example` to `.env` and fill in the credentials:

```bash
cp apps/address-service/bin/local/.env.example apps/address-service/bin/local/.env
```

2. Make sure both **condo** and **address-service** are running and accessible at the URLs you specified.

3. The condo user must have read access to the `Property` model. Typically a service user or admin account.

## Scripts

### merge-duplicate-addresses.js

Bulk auto-merge duplicate addresses that were flagged by the heuristic-based deduplication system.

**What it does:**

For each `Address` with `possibleDuplicateOf` set:
1. Checks which of the two addresses is actually referenced by a `Property` in condo (`Property.addressKey = Address.id`)
2. If only one is referenced — that one wins, the other is merged into it
3. If neither is referenced — the target (existing) address wins by default
4. If both are referenced — skips the pair for manual resolution via admin UI

**Usage (from the repo root):**

```bash
# Dry run — shows what would happen without making changes
source apps/address-service/bin/local/.env
node apps/address-service/bin/local/merge-duplicate-addresses.js --dry-run

# Actual run
source apps/address-service/bin/local/.env
node apps/address-service/bin/local/merge-duplicate-addresses.js
```

Ambiguous cases (both addresses referenced) should be resolved manually via the address-service admin UI using the duplicate resolution button on the Address detail page.
