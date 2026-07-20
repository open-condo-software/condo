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
GraphQL resolver / schema.find|create|…
    ↓
Keystone list adapter (find / itemsQuery / _create / …)
    ↓
BalancingReplicaKnexAdapter
    ├─ executeFind / executeItemsQuery / executeCreate / …
    │     → dataProviders registry for non-SQL sources (e.g. kv)
    └─ knex.client.runner hook
           ├─ match DATABASE_ROUTING_RULES → pick pool
           ├─ ProviderPool → executeProviderSql* → provider CRUD
           ├─ SELECT + cross-pool JOIN → planCrossPoolSelect rewrites SQL
           ├─ mutation → routed pool executes write
           └─ KnexPool → RoundRobin → physical knex client → Postgres
```

**Three independent knobs** (often confused — keep them separate):

1. **Pool routing** (`DATABASE_URL`, `DATABASE_POOLS`, `DATABASE_ROUTING_RULES`) — which backend runs a query (Postgres pool or provider pool).
2. **Table → pool map** (derived at connect from pool introspection + routing rules) — which pool owns a table for cross-db logic.
3. **GraphQL relation planner** (`CROSS_DB_RELATION_PLANNER_ENABLED`) — `CrossDbPlanner` in `databaseAdapters/crossDb/`, wired from `GqlWithKnexLoadList` in the condo app.

## BalancingReplicaKnexAdapter in 60 seconds

1. **Connect** — open one knex client per named DB in `DATABASE_URL`, group them into pools (`DATABASE_POOLS`). Provider pools (`provider: "kv"`) skip Postgres clients.
2. **Route** — patch `this.knex.client.runner`. Every query: parse SQL → build context `{ gqlOperationType, gqlOperationName, sqlOperationName, tableName }` → first matching rule → pool.
3. **Cross-pool SELECT** — if a SELECT JOINs a table on another pool, `planCrossPoolSelect` (in `crossSourceSelectSql.js`) runs filters on the remote pool, collects ids, rewrites to `base.fk IN (...)`.
4. **Writes** — mutations go to the pool that owns the table (`DATABASE_ROUTING_RULES` + source registry).
5. **Transactions / migrations** — always use writable Postgres pools (provider pools are skipped by kmigrator).

Detailed env var reference: [`adapters/BalancingReplicaKnexAdapter/README.md`](./adapters/BalancingReplicaKnexAdapter/README.md).

## File map

```text
databaseAdapters/
├── README.md                          ← you are here
├── index.js                           ← re-exports adapters + sourceRegistry + dataProviders
├── sourceRegistry.js                  ← table → pool map (from DATABASE_POOLS + routing rules)
├── dataProviders/
│   ├── index.js                       ← SOURCE_PROVIDERS registry (add new backends here)
│   ├── providerMethods.js             ← capability checks + in-memory itemsQuery helpers
│   ├── executeProviderSql.js          ← Keystone SQL → provider.create/find/update/delete
│   └── kv.js                          ← Redis/Valkey document CRUD
├── crossDb/
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
| `DATABASE_URL` | `custom:{"main":"postgresql://...","replica":"postgresql://..."}` |
| `DATABASE_POOLS` | JSON: Postgres pool → `{ databases, writable, balancer? }` or provider pool → `{ provider, writable }` |
| `DATABASE_ROUTING_RULES` | JSON array; must end with `{ "target": "<writable-pool>" }` |
| `DATABASE_POOL_MAX` | Knex pool size per DB (default `3`) |

### Cross-database (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `CROSS_DB_RELATION_PLANNER_ENABLED` | — | `true` enables GraphQL relation planner |
| `CROSS_DB_JOIN_FILTER_IDS_LIMIT` | `10000` | Max ids for SQL JOIN rewrite |
| `CROSS_DB_RELATION_FILTER_IDS_LIMIT` | `50000` | Max ids for GraphQL relation filters |
| `CROSS_DB_RELATION_FILTER_MAX_PAGES` | `ceil(IDS_LIMIT / 1000) + 1` | Pagination cap for relation id collection |

**Main-pool fast path:** lists with no relationship to another pool skip CrossDbPlanner rewrite, SELECT JOIN rewrite wrapping, and mutation FK validation (cached hints in `crossDb/crossSourceHints.js`). Remaining cost is only `DATABASE_ROUTING_RULES` matching in the knex runner — same as BalancingReplica before external tables.

**Write path:** `validateCrossSourceReferences` runs on INSERT/UPDATE when relationship fields point to a table on another pool. `enforceCrossSourceDeleteConstraints` restores inbound `on_delete` (PROTECT / CASCADE / SET_NULL) when deleting a parent on another pool (soft-delete only enforces PROTECT).

## How to add a new data provider (KV, Mongo, …)

**One place:** `dataProviders/index.js`. Provider pools are supported by **`BalancingReplicaKnexAdapter` only** (not Prisma).

1. Create `dataProviders/<name>.js` with `find` / `create` / `update` / `delete` as needed. Optional `matchFind` narrows which find filters the provider handles.
2. Add one line to `SOURCE_PROVIDERS` in `dataProviders/index.js`.
3. Add a provider pool in `DATABASE_POOLS` and route the table in `DATABASE_ROUTING_RULES`:

```dotenv
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","writable":true}}
DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
```

Postgres pools use `databases: [...]`. Provider pools use `provider: "<name>"` and `writable: true` for mutations.

Dual entry points:

- `schema.js` → `executeFind` / `executeCreate` / `executeUpdate` / `executeDelete` / `executeItemsQuery`
- GraphQL/knex SQL → `_patchKnexRunner` → `executeProviderSqlSelect` / `executeProviderSqlMutation`

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
  → _selectTargetPool(context)
  → ProviderPool? executeProviderSqlSelect
  → [SELECT] planCrossPoolSelect? → rewrite or pass through
  → KnexPool.getQueryRunner → Postgres
```

## Write path (sequence)

```text
mutation SQL
  → _selectTargetPool (routing rules + table owner)
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
yarn workspace @app/condo test domains/common/utils/serverSchema/index.spec.js
```

## Local dev preset

`bin/prepare.js -r, --replicate <app...>` (or `preset === 'production'`) writes replica pools and routing rules into the app `.env`.

## Migrations (kmigrator)

`BalancingReplicaKnexAdapter.__kmigratorKnexAdapters()` returns one knex stub per **writable Postgres** named database. Read-only replicas and **provider pools** are skipped. Helper: `databaseAdapters/utils/kmigratorKnexAdapter.js`.
