# Database adapters

How Condo routes reads and writes across multiple Postgres databases (and optional KV-backed tables).

## Quick start

| `DATABASE_URL` prefix | Adapter | Use when |
|----------------------|---------|----------|
| `postgresql://...` | `KnexAdapter` | Single database |
| `custom:{...}` | `BalancingReplicaKnexAdapter` | Multiple Postgres DBs, SQL-level routing |
| `prisma:postgresql://...` | `PrismaAdapter` | Single DB, Prisma ORM |
| `prisma-custom:{...}` | `BalancingReplicaPrismaAdapter` | Multiple DBs, Prisma (no SQL JOIN rewrite) |
| `mongodb://...` | `MongooseAdapter` | MongoDB |

Selection happens in `packages/keystone/setup.utils.js` → `getAdapter()`.

## Mental model

```text
GraphQL resolver / schema.find|itemsQuery …
    ↓
Keystone list adapter (find / itemsQuery / hooks → SQL)
    ↓
BalancingReplicaKnexAdapter
    ├─ executeFind / executeItemsQuery (schema raw reads → providers)
    │     → dataProviders registry for non-SQL sources (e.g. kv)
    └─ knex.client.runner hook
           ├─ match DATABASE_ROUTING_RULES → pick pool
           ├─ ProviderPool → executeProviderSql* → provider CRUD
           ├─ SELECT + cross-pool JOIN → planCrossPoolSelect rewrites SQL
           ├─ mutation → routed pool executes write (after Keystone hooks)
           └─ KnexPool → RoundRobin → physical knex client → Postgres
```

**Three independent knobs** (often confused — keep them separate):

1. **Pool routing** (`DATABASE_URL`, `DATABASE_POOLS`, `DATABASE_ROUTING_RULES`) — which backend runs a query (Postgres pool or provider pool).
2. **Table home pool** (`resolveTablePool` / `tablePool.js`, from `tableName` routing rules + default) — which pool owns a table for cross-db logic (not select→replicas).
3. **GraphQL relation planner** (`CROSS_DB_RELATION_PLANNER_ENABLED`) — `CrossDbPlanner` in `databaseAdapters/crossDb/`, wired from `GqlWithKnexLoadList` in the condo app.

## BalancingReplicaKnexAdapter in 60 seconds

1. **Connect** — open knex clients for the databases of Postgres pools; for `provider` pools call that provider's `connect()` with named `DATABASE_URL` entries.
2. **Route** — patch `this.knex.client.runner`. Every query: parse SQL → build context `{ gqlOperationType, gqlOperationName, sqlOperationName, tableName }` → first matching rule → pool.
3. **Cross-pool SELECT** — if a SELECT JOINs a table on another pool, `planCrossPoolSelect` (in `crossSourceSelectSql.js`) runs filters on the remote pool, collects ids, rewrites to `base.fk IN (...)`.
4. **Writes** — mutations go to the pool from `DATABASE_ROUTING_RULES` (first match; mutation targets must be writable).
5. **Transactions / migrations** — always use writable Postgres pools (provider pools are skipped by kmigrator).

Detailed env var reference: [`adapters/BalancingReplicaKnexAdapter/README.md`](./adapters/BalancingReplicaKnexAdapter/README.md).

## File map

```text
databaseAdapters/
├── README.md                          ← you are here
├── index.js                           ← re-exports adapters + crossDb + dataProviders
├── dataProviders/
│   ├── index.js                       ← SOURCE_PROVIDERS registry (add new backends here)
│   ├── providerMethods.js             ← capability checks + in-memory itemsQuery helpers
│   ├── executeProviderSql.js          ← Keystone SQL → provider.create/find/update/delete
│   └── kv.js                          ← Redis/Valkey document CRUD
├── utils/
│   ├── kmigratorKnexAdapter.js        ← per-database kmigrator stub
│   └── crossPoolConstraints.js        ← post-migrate cross-database FK reconcile
├── crossDb/
│   ├── tablePool.js                   ← table home pool from tableName routing rules + default
│   ├── planner.js                     ← GraphQL where-rewrite + relation hydration
│   ├── validateCrossSourceReferences.js
│   └── index.js
└── adapters/
    ├── KnexAdapter.js                 ← single-DB baseline
    ├── PrismaAdapter.js
    ├── BalancingReplicaKnexAdapter/
    │   ├── adapter.js                 ← routing hook, execute* hooks, ProviderPool runner
    │   ├── pool.js                    ← KnexPool + ProviderPool
    │   └── utils/
    │       ├── crossSourceSelectSql.js    ← SQL AST helpers + planCrossPoolSelect
    │       ├── env.js, rules.js, sql.js
    └── BalancingReplicaPrismaAdapter/ ← same env config shape; Postgres pools only (no provider pools)
```

GraphQL-side cross-db hydration: `packages/keystone/databaseAdapters/crossDb/` (`CrossDbPlanner`), used from `apps/condo/domains/common/utils/serverSchema/index.js` (`GqlWithKnexLoadList`).

## Environment variables

### Required for multi-DB (Knex)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `custom:{"main":"postgresql://...","replica":"postgresql://...","cache":"redis://..."}` |
| `DATABASE_POOLS` | JSON: Postgres pool → `{ databases, writable, balancer? }` or provider pool → `{ provider, writable, databases? }` |
| `DATABASE_ROUTING_RULES` | JSON array; must end with `{ "target": "<writable-pool>" }` |
| `DATABASE_POOL_MAX` | Knex pool size per DB (default `3`) |

### Cross-database (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `CROSS_DB_RELATION_PLANNER_ENABLED` | — | `true` enables GraphQL relation planner |
| `CROSS_DB_JOIN_FILTER_IDS_LIMIT` | `10000` | Max ids for SQL JOIN rewrite |
| `CROSS_DB_RELATION_FILTER_IDS_LIMIT` | `50000` | Max ids for GraphQL relation filters |
| `CROSS_DB_RELATION_FILTER_MAX_PAGES` | `ceil(IDS_LIMIT / 1000) + 1` | Pagination cap for relation id collection |

**Single-pool fast path:** lists whose related tables all live on the same pool skip CrossDbPlanner rewrite, SELECT JOIN rewrite wrapping, and mutation FK validation (cached hints in `crossDb/crossSourceHints.js`). Remaining cost is only `DATABASE_ROUTING_RULES` matching in the knex runner — same as BalancingReplica before external tables.

**Write path:** `validateCrossSourceReferences` runs on INSERT/UPDATE when relationship fields point to a table on another pool. `enforceCrossSourceDeleteConstraints` restores inbound `on_delete` (PROTECT / CASCADE / SET_NULL) on SQL DELETE of a parent on another pool. UPDATE (including plugin soft-delete) does not run ON DELETE — same as Postgres.

## How to add a new data provider (KV, Mongo, …)

**One place:** `dataProviders/index.js`. Provider pools are supported by **`BalancingReplicaKnexAdapter` only** (not Prisma).

1. Create `dataProviders/<name>.js` with `find` / `create` / `update` / `delete` as needed. Optional `matchFind` narrows which find filters the provider handles.
2. Optional lifecycle (so the adapter never learns Redis/Mongo/…):
   - `static isConnectionUrl(url)` and `static connectionUrlHint` — validate `DATABASE_URL` names listed on this pool
   - `connect()` / `disconnect()` — open and close this pool's clients from `{ connections: { name: url } }`
3. Add one line to `SOURCE_PROVIDERS` in `dataProviders/index.js`.
4. Add a provider pool in `DATABASE_POOLS` and route the table in `DATABASE_ROUTING_RULES`:

```dotenv
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","databases":["cache"],"writable":true}}
DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
```

Postgres pools use `databases: [...]` of `postgresql://` names. Provider pools use `provider: "<name>"` and may list `databases` from `DATABASE_URL`. Each provider decides which URI schemes it accepts (`kv` accepts `redis://` / `valkey://`). Without `databases`, `kv` falls back to `getKVClient('cross-db')`.

Dual entry points:

- `schema.find` / `schema.itemsQuery` → `executeFind` / `executeItemsQuery` (raw reads)
- GraphQL mutations → Keystone hooks → knex SQL → `_patchKnexRunner` →
  `executeProviderSqlSelect` / `executeProviderSqlMutation`

## How to add a new balancing adapter variant

1. Extend `KnexAdapter` or `PrismaAdapter`.
2. Reuse `utils/env.js` + `utils/rules.js` for pool config and rule matching.
3. Intercept the execution point:
   - **Knex:** patch `this.knex.client.runner` (see `BalancingReplicaKnexAdapter._patchKnexRunner`).
   - **Prisma:** wrap model delegates in `_connect` (see `BalancingReplicaPrismaAdapter`).
4. Register in `setup.utils.js` → `getAdapter()` with a distinct `DATABASE_URL` prefix.
5. Export from `databaseAdapters/adapters/index.js`.

## Read path (sequence)

```text
resolver sets graphqlCtx
  → listAdapter builds knex query
  → runner hook: extractCRUDQueryData(sql)
  → _selectTargetPoolName(context) → pool name
  → this._replicaPools[name]
  → ProviderPool? executeProviderSqlSelect
  → [SELECT] planCrossPoolSelect? → rewrite or pass through
  → KnexPool.getQueryRunner → Postgres
```

## Write path (sequence)

```text
mutation SQL
  → _selectTargetPoolName (first matching DATABASE_ROUTING_RULES → pool name)
  → ProviderPool? executeProviderSqlMutation
  → [INSERT/UPDATE] validateCrossSourceReferences when FK targets another pool
  → target pool executes
  → return result
```

## Tests

```bash
# Balancing adapter + dataProviders unit tests
yarn workspace @open-condo/keystone test databaseAdapters/

# GraphQL cross-db planner
yarn workspace @open-condo/keystone test databaseAdapters/crossDb/planner.spec.js
```

## Local dev / CI presets

`bin/prepare.js` writes the `DATABASE_*` config into the app `.env`, creates every database it
references, and then migrates:

| Flag | Result |
|------|--------|
| *(none)* | `DATABASE_URL=postgresql://...` — single database, plain `KnexAdapter` |
| `-r, --replicate <app...>` (or `-p production`) | `custom:{main,replica}` — read replica pool |
| `-s, --split <app>:<pool>=<Table>[,<Table>...]` | adds a writable pool with its own database and a `tableName` routing rule |

```bash
# Message + MessageHistoryRecord on their own database (what CI runs)
node bin/prepare.js -f condo --split condo:message=Message,MessageHistoryRecord
```

Which tables live where is deployment configuration: it lives in this flag and in
`DATABASE_ROUTING_RULES`, never in adapter code.

## Migrations (kmigrator)

**One migration set, any topology.** Migrations never mention pools, so the same files apply
to a single database and to a split one.

1. `__kmigratorKnexAdapters()` returns one knex stub per **writable Postgres** database
   (read-only replicas and provider pools are skipped; helper:
   `databaseAdapters/utils/kmigratorKnexAdapter.js`). kmigrator runs the **full** migration set
   on each, so every database ends up with the complete schema and any table can be routed to
   any database without extra DDL.
2. `__kmigratorReconcileTopology()` then aligns each database with the routing config
   (`databaseAdapters/utils/crossPoolConstraints.js`). A FK constraint whose two tables are
   homed in different databases can never hold — Postgres would check it against an empty local
   copy of the referenced table — so it is dropped and recorded in
   `_cross_pool_dropped_constraints`. Recorded constraints are re-added once their two tables
   share a database again, which makes moving a table back a plain `migrate`.

Consequences worth knowing:

- Dropping an FK constraint does **not** drop indexes; kmigrator declares FK column indexes
  separately, so they survive.
- Dropped constraints are replaced by adapter-side enforcement:
  `validateCrossSourceReferences` on INSERT/UPDATE and `enforceCrossSourceDeleteConstraints`
  on DELETE.
- On a single-database config the whole step is a no-op and the bookkeeping table is never
  created.
- The schema is extracted once (it is identical across databases), so `makemigrations --check`
  reports the same result regardless of how many databases are configured.
