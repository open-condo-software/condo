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

### Minimal downtime migration (advanced option)

This option is a bit harder to execute, but is suitable for environments 
that have strict SLAs and even short downtime is unacceptable.

We are going to use [RedisShake](https://github.com/tair-opensource/RedisShake) for data migration and transformation during the main application operation.

1) First of all you need to create another instance of key-value storage up and running. You can set up another instance of Redis create new instance with Valkey sources.
2) Follow [instructions from original repo](https://github.com/tair-opensource/RedisShake) to setup RedisShake migration tool a proper way. I provide a config that will help with this:
```toml
# shake.toml
[sync_reader]
cluster = false            # Set to true if the source is a Redis cluster
address = "127.0.0.1:6379" # For clusters, specify the address of any cluster node; use the master or slave address in master-slave mode
username = ""              # Keep empty if ACL is not in use
password = ""              # Keep empty if no authentication is required
tls = false                # Set to true to enable TLS if needed
sync_rdb = true            # Set to false if RDB synchronization is not required
sync_aof = true            # Set to false if AOF synchronization is not required
prefer_replica = false     # Set to true to sync from a replica node
try_diskless = false       # Set to true for diskless sync if the source has repl-diskless-sync=yes


[redis_writer]
cluster = false            # set to true if target is a redis cluster
address = "127.0.0.1:6380" # when cluster is true, set address to one of the cluster node
username = ""              # keep empty if not using ACL
password = ""              # keep empty if no authentication is required
tls = false

function = """
local news_sharing_old = "news_sharing_greendom:"
local bull_default_prefix = "bull:tasks"
local bull_low_prefix = "bull:low"
local bull_high_prefix = "bull:high"

local db_hash = {
  [0] = "condo:"
}

local SOURCE_DB = DB

for i, index in ipairs(KEY_INDEXES) do
  local key = ARGV[index]

  if string.sub(key, 1, #bull_default_prefix) == bull_default_prefix then
    ARGV[index] = "{" .. db_hash[SOURCE_DB] .. bull_default_prefix .. "}" .. string.sub(key, #bull_default_prefix + 1)
  elseif string.sub(key, 1, #bull_low_prefix) == bull_low_prefix then
    ARGV[index] = "{" .. db_hash[SOURCE_DB] .. bull_low_prefix .. "}" .. string.sub(key, #bull_low_prefix + 1)
  elseif string.sub(key, 1, #bull_high_prefix) == bull_high_prefix then
    ARGV[index] = "{" .. db_hash[SOURCE_DB] .. bull_high_prefix .. "}" .. string.sub(key, #bull_high_prefix + 1)
  else
    ARGV[index] = db_hash[SOURCE_DB] .. key
  end
end

shake.call(SOURCE_DB, ARGV)
"""
```
Also, you can change mapping inside `db_hash` variable to match your applications setup (For example, condo application has "0" db index inside Redis, address-service has "1" and so on).
3) Edit target urls and run `./redis-shake shake.toml`. Wait for the full synchronization.
4) Change target url for the key-value storage to a new instance for all of your running apps
5) Perform a synchronous restart all of your apps
6) Check everything working good. After that you can down your old Redis instance 
