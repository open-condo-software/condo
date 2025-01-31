#  Guide to major migrations in [`@open-condo-software/condo`](https://github.com/open-condo-software/condo) platform

We value our time and yours, so backwards compatible releases are our key priority. 
However, sometimes they happen from various reasons: poorly designed / out-of-date features, 
global infrastructure / architecture changes. This article allows you to understand the motivation for such changes 
and painlessly upgrade a major version at your premises.

## Migration guides:
- [From 2.x to 3.x](#from-2x-to-3x)


## From 2.x to 3.x

### Motivation

In the 3.0.0 release, we are going to support different key-value databases compatible with Redis.

This will be done for a number of reasons:
- **[Redis itself is no longer Open Source, but source available](https://redis.io/blog/redis-adopts-dual-source-available-licensing/)**, which limits the choice of versions and updates 
that our applications can use. Making subsequent performance boosts by updating kv-storage impossible. 
That's why we've chosen [Valkey](https://valkey.io) as our new kv-storage.
- **Absence of virtual bases in the cluster**. In the current setup, we use single host with Redis 
and its virtual bases (`/0`, `/1`, etc.) on remote and local development environments.
To ensure scalability of the system, we will need to support clustered setups. 
However, cluster setups have no support for virtual databases. 
Therefore, in order not to set up a separate cluster for each application locally, 
we will use single cluster, with separate key namespaces.

To summarize, we want to support any Redis compliant storage in a variety of configurations:
- Single machine / cluster for multiple applications (useful for local setups, test environments and early adoption)
- Distributed replicated cluster for each application (recommended for big production setups)
- And anything in between

### Breaking changes

#### Redis keys format is changed
To allow multiple applications to write to the same database, we need to separate their keys from each other.
We do this as follows: [IORedis](https://github.com/redis/ioredis) supports key prefixes out of the box, so 
we'll just change the client initialization in `getRedisClient` and everything will continue to work. 

Prefixes will be automatically generated according to the following principle:
- Will take the name from the current package.json in process.cwd (For example `@app/resident-app`)
- The scope will be separated from the name (`@app/resident-app` -> `resident-app`).
- The remainder will be converted to snake_case (`resident-app` -> `resident_app`) to follow key naming best practices.

You don't need to change anything in the code of the application itself, IORedis will do everything for you:
```typescript
// Somewhere in apps/condo/**
const redis = getRedisClient()
await redis.set('key:subkey', 'value1') // will be stored as “condo:key:subkey” in db
const value = await redis.get('key:subkey') // value1
```
```typescript
// Somewhere in apps/miniapp/**
const redis = getRedisClient()
await redis.set('key:subkey', 'value2') // will be stored as “miniapp:key:subkey” in db
const value = await redis.get('key:subkey') // value2
```

Renaming keys will happen as part of normal migrations, so you don't have to manually migrate existing keys 
if you use `yarn migrate` as part of your deployment process. 
Below we have prepared 2 options for you to migrate existing environments.

### Migration with downtime (simple option)

This is the easiest migration option and requires no extra effort. To perform it, do the following:

1) Stop running `@app/condo` applications and workers to make sure nothing's being written to the kv database.
2) Clone 3.x codebase to your machines
3) Apply new migrations using `yarn workspace @app/condo migrate`, one of them will rename all existing keys
4) Start application and workers as usual using `yarn workspace @app/condo start` and `yarn workspace @app/condo worker`

> The commands above use `@app/condo` as an example, 
> but the same instruction must be applied to all other keystone applications you're running as well.

### Zero downtime migration (advanced option)

This option is a bit harder to execute, but is suitable for environments 
that have strict SLAs and even short downtime is unacceptable.

1) Deploy the latest 2.x version of the condo app as you usually do. But make sure to set the following environment variable: 
`REDIS_FALLBACK_CONFIG='{"enabled": true}'` to all apps / workers.  
By doing this, you will put the redis client into fallback mode, in which:
    1) All write commands will use prefix:  
    `await redis.set('key', 'value') // stored as "<prefix>:key"`
    2) All read commands will try to get the value with the prefixed key first, and if they don't find it, 
    they will try to get it without it.
2) After that deploy 3.x version. This will rename all existing keys without prefix to prefixed version 
during database migration (`yarn workspace @app/condo migrate`) step. 
The difference is **you can keep running existing 2.x** pods while performing migration.
3) Once migration is finished you can smoothly replace 2.x pods with 3.x, while disabling redis fallback.

> Although the latest 2.x release with `REDIS_FALLBACK_CONFIG` is backward compatible, 
> we **don't recommend staying on it for an extended period of time**, but rolling out 3.x right after it, 
> since in fallback mode the **response latency from Redis can be doubled** due to fallback mode.

> If you already use your own prefix for keys - you can also configure the adapter for migration using the following configuration:
> ```dotenv
> REDIS_FALLBACK_CONFIG='{"enabled": true, "prefix": "your_existing_prefix"}'
> ```




