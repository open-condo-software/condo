# BalancingReplicaKnexAdapter

Multi-database Postgres adapter. Extends Keystone's `KnexAdapter`.

**Start here:** [database adapters overview](../README.md) — architecture, file map, how to extend.

## When to use

- Read replicas or dedicated DBs for historical / billing / counts tables
- Dedicated writable pools for specific table groups (e.g. Message on a separate DB)
- Cross-pool SQL JOIN rewrite (Keystone-style `LEFT JOIN`)

Use `DATABASE_URL=custom:{...}` (see `setup.utils.js`).

## Configuration

Three required env vars plus optional cross-db settings (documented in the [global README](../README.md)).

### `DATABASE_URL`

Named connection strings:

```dotenv
DATABASE_URL=custom:{"main":"postgresql://user:pass@127.0.0.1:5432/main","replica":"postgresql://user:pass@127.0.0.1:5433/replica"}
```

### `DATABASE_POOLS`

```dotenv
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"replicas":{"databases":["replica"],"writable":false},"kv":{"provider":"kv","writable":true}}
```

| Field | Description |
|-------|-------------|
| `databases` | Names from `DATABASE_URL` (Postgres pools) |
| `provider` | Registered data provider name, e.g. `kv` (non-SQL pools; no `databases`) |
| `writable` | `true` if pool accepts insert/update/delete |
| `balancer` | Optional for Postgres pools, default `RoundRobin` |

Provider pools are **Knex-only** (`BalancingReplicaKnexAdapter`). Do not use `provider` with `prisma-custom:`.

### `DATABASE_ROUTING_RULES`

First matching rule wins. Conditions are AND-ed. Last rule must be the default (no conditions).

```dotenv
DATABASE_ROUTING_RULES=[{"target":"main","gqlOperationType":"mutation"},{"target":"replicas","sqlOperationName":"select"},{"target":"main"}]
```

| Field | Description |
|-------|-------------|
| `target` | Pool name (required) |
| `gqlOperationType` | `query` or `mutation` |
| `gqlOperationName` | GraphQL root field name or RegExp string |
| `sqlOperationName` | `select`, `insert`, `update`, `delete`, `show` |
| `tableName` | Table name or RegExp string |

**Note:** Sub-resolvers each set their own `gqlOperationName`. Direct `find()` calls have no GraphQL context.

### Example rules (TypeScript)

```typescript
const routingRules = [
    { gqlOperationName: 'registerBillingReceipt', sqlOperationName: 'select', tableName: '^Billing.+$', target: 'replicas' },
    { gqlOperationName: '^.+Meta$', target: 'counts' },
    { tableName: '^.+HistoryRecord$', target: 'historical' },
    { gqlOperationType: 'mutation', target: 'main' },
    { sqlOperationName: 'select', target: 'replicas' },
    { target: 'main' },
]
```

## Code layout

| File | Role |
|------|------|
| `adapter.js` | Connect pools, patch knex runner, `execute*` hooks, ProviderPool SQL bridge |
| `pool.js` | `KnexPool` + `ProviderPool` |
| `utils/crossSourceSelectSql.js` | SQL AST helpers + `planCrossPoolSelect` (cross-pool JOIN rewrite) |
| `utils/env.js` | Parse and validate config |
| `utils/rules.js` | Rule matching |
| `utils/sql.js` | SQL operation + table extraction |

## Runtime behaviour

### Reads

1. GraphQL resolver stores operation type/name in `graphqlCtx`.
2. Knex builds SQL; `adapter._patchKnexRunner` intercepts execution.
3. `_routeToPool` picks a pool from rules.
4. Cross-pool JOINs: planner queries remote pool, rewrites SQL, runs on base pool.
5. Otherwise: pool's knex client runs the query.

**Main-pool fast path:** lists with no cross-source outbound FKs skip SELECT rewrite wrapping
and `prepareCrossDbWhere` returns the original `where` (same cost profile as pre-multi-db,
aside from pool routing). See `crossDb/crossSourceHints.js`.

### Writes

1. `_selectTargetPool` picks the owning pool (routing rules + source registry).
2. Cross-source FK validation runs only when the list has outbound FKs (insert/update) or
   inbound dependents (hard delete / soft-delete). Ordinary updates on inbound-only parents
   (e.g. Organization) are not wrapped.
3. Target pool executes the mutation.

### KV-backed tables

Register the provider in `dataProviders/index.js`, then add a provider pool and routing rule:

```dotenv
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","writable":true}}
DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
```

Reads: `find` / `itemsQuery` with `{ id }` / `{ id_in }` (optional `deletedAt: null`). Writes store full row JSON. GraphQL/knex SQL is translated via `executeProviderSql*`. Capability is inferred from method presence (`create` / `update` / `delete` / `find`); optional `matchFind` narrows supported filters.

## Adding features

See [How to add a new data provider](../README.md#how-to-add-a-new-data-provider-kv-mongo-) and [How to add a new balancing adapter variant](../README.md#how-to-add-a-new-balancing-adapter-variant) in the parent README.
