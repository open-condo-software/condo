#  Guide to major migrations in [`@open-condo-software/condo`](https://github.com/open-condo-software/condo) platform

We're trying our best to avoid breaking changes during the development cycle.
However, sometimes this changes happen from various reasons: poorly designed / out-of-date features,
global infrastructure / architecture changes. 

This article allows you to understand the motivation for such changes
and painlessly upgrade a major version at your premises.

## Migration guides:
- [From 2.x to 3.x](#from-2x-to-3x)


## From 2.x to 3.x

### Motivation

In the 3.x release, we want to support various KV databases whose APIs are compatible with [Redis](https://redis.io).

This will be done for a number of reasons:
- **[Redis itself is no longer Open Source, but source available](https://redis.io/blog/redis-adopts-dual-source-available-licensing/)**, 
  which limits the choice of versions and updates
  that our applications can use. These updates most often contain performance increases as well as vulnerability closures. 
  This is important to us, so we decided to move away from Redis towards [Valkey](https://valkey.io) as our KV storage.
- **Absence of virtual bases in the cluster**. In the current setup, we use single standalone host with Redis
  and its virtual bases (`/0`, `/1`, etc.) on remote and local development environments. 
  This allows us to store data from multiple applications into single machine.
  To ensure scalability of the system, we will need to support sharded cluster deployments, 
  so that storage can expand without downtime as data grows. 
  However, cluster setups have no support for virtual databases.
  So to avoid creating a separate cluster for each application locally, as we do for production/test environments, 
  we will use a single cluster but with separate key namespaces for each application.

**To summarize**, we want to support any Redis compliant storage in a variety of configurations:
- Single machine / cluster for multiple applications (useful for local setups, test environments and early adoption)
- Distributed replicated cluster for each application (recommended for big production setups)
- And anything in between

### Breaking changes


- #### `@open-condo/keystone/redis` is renamed to `@open-condo/keystone/kv`

This is done to move away from being tied to Redis as kv storage. 
Note that we will continue to use [`ioredis`](https://github.com/redis/ioredis), which still has an MIT license, 
as the client library so that all our changes will be compatible with Redis.



- #### KV storage keys format is changed
To allow multiple applications to write to the same database, we need to separate their keys from each other.
We do this as follows: [`ioredis`](https://github.com/redis/ioredis) supports key prefixes out of the box, so
we'll just change the client initialization in `getKVClient` and everything will continue to work.

Prefixes will be automatically generated according to the following principle:
- Will take the name of application from the current package.json in process.cwd (For example `@app/resident-app`)
- The scoped part will be separated from the name (`@app/resident-app` -> `resident-app`).
- The remainder will be converted to snake_case (`resident-app` -> `resident_app`) to follow the most common key naming practices.

You don't need to change anything in the code of the application itself, IORedis will do everything for you:
```typescript
// Somewhere in apps/condo/**
const { getKVClient } = require('@open-condo/keystone/kv') 
const kv = getKVClient()
await kv.set('key:subkey', 'value1') // will be stored as “condo:key:subkey” in db
const value = await kv.get('key:subkey') // value1
```
```typescript
// Somewhere in apps/miniapp/**
const { getKVClient } = require('@open-condo/keystone/kv')
const kv = getKVClient()
await kv.set('key:subkey', 'value2') // will be stored as “miniapp:key:subkey” in db
const value = await kv.get('key:subkey') // value2
```

> **Important note**: Redis / Valkey cluster configuration does not allow 
> to use transactions with keys that reside in different nodes. 
> To avoid this, some of the keys will now use [hashtags](https://redis.io/blog/redis-clustering-best-practices-with-keys/). 
> In particular, bull keys will now be `{<key_prefix>:bull:<queue_name>}:rest_of_key`.

We have prepared some guards in migrations and at application startup that will prevent it from running with an old version of keys.

Below we have prepared few options for you to migrate existing environments.

### Local migration using [`@open-condo/migrator`](../packages/migrator/README.md)

To migrate monorepo locally, do the following:
1. Stop all running applications and workers to prevent writing to KV storage.
2. From monorepo root run the following command and follow the CLI instructions:
```bash
npx @open-condo/migrator add-apps-kv-prefixes
```
3. Start apps as usual using `migrate` and `dev` / `start` / `worker` scripts.

### Remote migration with downtime using [`@open-condo/migrator`](../packages/migrator/README.md)

This approach will work for you if you can afford a few minutes of downtime and don't want to bother with replication.

> NOTE: Our internal tests shows, that migrator can migrate 3-4 millions keys per minute, 
> use this as a baseline to compute your downtime.

This approach is very similar to the local approach described above except for a couple of differences.

1. Even though migrator is fully covered in tests, 
**make sure you have a fresh backup of your base** in case of human error.
2. For each application do the following:
    1. Stop applications main and worker processes to avoid tasks loss.
    2. Run migrator for specific app using the command below and follow the CLI instructions, 
     where `<app-name>` is name of the app you're currently migrating (`condo`, `address-service`, etc.):
    ```bash
    npx @open-condo/migrator add-apps-kv-prefixes -f <app-name>   
    ``` 
   3. Redeploy 3.x application (run `migrate` + `start` scripts as you usually do)

As you can see, this approach allows you to stop only 1 application at time, while keep others running.

> Make sure to check [`@open-condo/migrator` docs](../packages/migrator/README.md) to see all available running options.

### Minimal downtime migration (advanced option)

This option is a bit harder to execute, but is suitable for environments
that have strict SLAs and even short downtime is unacceptable.

We are going to use [RedisShake](https://github.com/tair-opensource/RedisShake) for data migration and 
transformation during the main application operation. 

The idea is to bring up a second (new) Redis nearby, into which to migrate all existing keys and 
set up real-time replication with the addition of keyPrefix. 
Then at release point 3.0 just redirect applications to the new base, make sure everything is working properly 
and shut down the old Redis.

1) First of all you need to create another instance of key-value storage up and running. You can set up another instance of Redis or Valkey.
2) Follow [instructions from original repo](https://github.com/tair-opensource/RedisShake) to setup RedisShake migration tool a proper way. We provide a config that will help with this:
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
4) Once RedisShake is running in realtime replication mode, go to the original databases and run the following command, to remove protection guards:
```
SET data_version 2
```
5) Then RedisShake will replicate this to new database with prefix, so apps can be deployed
4) Change target url for the key-value storage to a new instance for all of your running apps
5) Perform a synchronous restart all of your apps. 
**It's important to kill all existing application main and worker processes before staring new ones**, otherwise some tasks data might be corrupted.
6) Check everything working good. After that you can down your old Redis instance 