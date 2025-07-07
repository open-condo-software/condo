#  Guide to major migrations in [`@open-condo-software/condo`](https://github.com/open-condo-software/condo) platform

We're trying our best to avoid breaking changes during the development cycle.
However, sometimes this changes happen from various reasons: poorly designed / out-of-date features,
global infrastructure / architecture changes. 

This article allows you to understand the motivation for such changes
and painlessly upgrade a major version at your premises.

## Migration guides:
- [From 2.x to 3.x](#from-2x-to-3x)
- [From 3.x to 4.x](#from-3x-to-4x)


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

### Installing [`@open-condo/migrator`](../packages/migrator/README.md)

We've prepared a dedicated package, which can perform various migrations for you 
and published it to [npm](https://www.npmjs.com/package/@open-condo/migrator), so you can download it from there or
build it from sources locally in [condo monorepo](https://github.com/open-condo-software/condo).

#### Using migrator from npm

To use prebuild and published migrator run the following command:
```bash
npm i -g @open-condo/migrator
```

#### Using local migrator

This options is preferred, when you already have condo repo on your machine. To build migrator do the following:

1. Make sure monorepo dependencies are installed by running:
```bash
yarn
```
2. Build migrator using:
```bash
yarn workspace @open-condo/migrator build
```
3. Run `yarn` again to transfer built migrator package to your monorepo node_modules folder:
```bash
yarn
```

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
6) Deploy 3.0 apps as usually do, now `migrate` and `start` steps will be successful, but keep in mind 2 important notes:
    1. Make sure to disable graceful shutdown. If old applications (2.x) and workers and new ones (3.0) 
   will be running at the same time there's risk, that some information about tasks will be lost / corrupted. 
   **So make sure to kill old apps first and start new ones right after**.
   2. New apps (3.x) must point to new redis instance, so make sure to change `KV_URL` / `REDIS_URL` accordingly
7) Check everything working good. After that you can down your old Redis instance 

## From 3.x to 4.x

### Motivation

In 4.0 release we want to update our sever-side stack to 
- Be compatible with modern Node app hosting solutions, such as [Vercel](https://vercel.com) or [Render](https://render.com), 
- Improve applications performance,
- Unlock new features
- Close security issues of Node itself and our dependencies.

### Breaking changes

#### Migration from `@keystonejs` to `@open-keystone`

For a long time, the stop factor in updates for us was the `@keystonejs` packages themselves. 
Unfortunately the authors of keystone-5 stopped actively supporting it and moved to keystone-6, which has less flexibility and features, 
and breaking changes in the API, so we can't afford a move to it yet.

Instead, we decided to create our own fork of `@keystonejs` called `@open-keystone`.
We will keep it as close to the original as possible, 
only updating dependencies to address vulnerabilities and supporting new runtimes.

#### Drop of Webpack@4

After the move from `@keystonejs` we were given the opportunity to update the webpack 
in the `@open-condo/app-admin-ui` package, 
which allowed us to update it and `@open-condo/app-next` to versions that use webpack@5, 
now our entire repository uses one version.

#### Migration to css-modules, and drop of component-level css / less

Up to this point, we've been using [emotion](https://emotion.sh/docs/introduction) to override styles in place. 
However, using emotion quite often created a flick effect. 
We are now planning to move to css modules, which are officially supported by modern Next.js. 
To achieve this we had to abandon the deprecated `@zeit/less` and `@zeit/css` packages. 
Along with them went the ability to import `.less` / `.css` files at the component level. 
Now it can only be done in `_app.tsx`. 
If you used some condo components imports in your applications (like Layout), they will lose styles after 4.0.

#### Drop old versions of Node.js and some encryption methods

Moving to `@open-keystone` has allowed us to close many vulnerabilities in packages, and most importantly, 
to run applications on later versions of Node.

All current applications from now on run on the current LTS version of Node.js, i.e. **Node.js 22**.


> **Important:** [Node.js 17 and above has updated the open-ssl version for encryption](https://nodejs.org/en/blog/release/v17.0.0), thereby removing some older encryption algorithms. If you use the recommended settings in `EncryptionManager` (fields with type `EncryptedText`), there should be no problem. Otherwise, you will have to re-encrypt the data before migration.



### What else updated
- `@keystonejs` modules -> `@open-keystone` modules
- `Node.js` from 16.x to 22.x,
- `graphql` from 15.x to 16.x
- `apollo-server-express` from 2.x to 3.x
- `knex` from 0.95 to 3.1
- `Next.js` from 9.5 to 12.3.7
- `React` from 16.x to 17.0.2

Full changes can be found here: https://github.com/open-condo-software/condo/pull/6313

### Migration guide

As long as you're using non-modified version of applications 
and not using legacy encryption algorithms, just deploy newer Dockerfile with Node.js 22, 
and you're good to go. 

For forks, custom applications and others, follow the recommendations from breaking changes section.