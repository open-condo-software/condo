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
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"replicas":{"databases":["replica"],"writable":false}}
```

| Field | Description |
|-------|-------------|
| `databases` | Names from `DATABASE_URL` |
| `writable` | `true` if pool accepts insert/update/delete |
| `balancer` | Optional, default `RoundRobin` |

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
| `adapter.js` | Connect pools, patch knex runner, `executeFind` via dataProviders |
| `pool.js` | `KnexPool` — pick a client inside a pool |
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

### Writes

1. `_selectTargetPool` picks the owning pool (routing rules + source registry).
2. Cross-source FK validation runs when needed.
3. Target pool executes the mutation.

### KV-backed tables

Register the provider in `dataProviders/index.js`, then add a provider pool and routing rule:

```dotenv
DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","writable":false}}
DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
```

Only `find` with `{ id }` / `{ id_in }` is supported.

## Adding features

See [How to add a new data provider](../README.md#how-to-add-a-new-data-provider-kv-mongo-) and [How to add a new balancing adapter variant](../README.md#how-to-add-a-new-balancing-adapter-variant) in the parent README.
