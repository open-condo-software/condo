const { KnexAdapter } = require('@open-keystone/adapter-knex')
const { versionGreaterOrEqualTo } = require('@open-keystone/utils')
const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

const { KnexPool } = require('./pool')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')
const { logger } = require('./utils/logger')
const { isRuleMatching } = require('./utils/rules')
const { extractCRUDQueryData } = require('./utils/sql')

const DEFAULT_POOL_MAX = conf['DATABASE_POOL_MAX']
    ? parseInt(conf['DATABASE_POOL_MAX'], 10)
    : 5;

const DEFAULT_POOL_CONFIG = {
    min: 3,
    max: DEFAULT_POOL_MAX,
    acquireTimeoutMillis: 15000,
    idleTimeoutMillis: 2000,
    propagateCreateError: false
};

function wirePoolDebug(knex, name) {
    const pool = knex.client && knex.client.pool;
    if (!pool || pool.__wired) return;
    pool.__wired = true;
    const tag = `[POOL ${name}]`;
    pool.on('acquireRequest', () => console.log(tag, 'acquireRequest'));
    pool.on('acquireSuccess', () =>
        console.log(tag, 'acquireSuccess used=', pool.numUsed(), 'free=', pool.numFree())
    );
    pool.on('release', () =>
        console.log(tag, 'release used=', pool.numUsed(), 'free=', pool.numFree())
    );
    pool.on('createSuccess', () =>
        console.log(tag, 'createSuccess size=', pool.numUsed() + pool.numFree())
    );
    pool.on('destroySuccess', () =>
        console.log(tag, 'destroySuccess size=', pool.numUsed() + pool.numFree())
    );
}

function logPool(knex, name = 'default') {
    const pool = knex.client && knex.client.pool;
    if (!pool) return;
    console.log(
        `[POOL ${name}] used/free/pendingCreate/pendingAcquire:`,
        pool.numUsed(),
        pool.numFree(),
        pool.numPendingCreates(),
        pool.numPendingAcquires()
    );
}

class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor({ databaseUrl, replicaPools, routingRules } = {}) {
    super();
    this._dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL']);
    const availableDatabases = Object.keys(this._dbConnections);

    this._replicaPoolsConfig = getReplicaPoolsConfig(
      replicaPools || conf['DATABASE_POOLS'],
      availableDatabases
    );

    this._routingRules = getQueryRoutingRules(
      routingRules || conf['DATABASE_ROUTING_RULES'],
      this._replicaPoolsConfig
    );

    // for teardown
    this._knexClients = null;
    this._replicaPools = null;
    this._defaultPool = null;

    // Keystone's minimum supported Postgres version
    this.minVer = this.minVer || '9.6';
  }

    async _initKnexClients() {
        const dbNames = Object.keys(this._dbConnections);
        const maxConnections = DEFAULT_POOL_MAX;

        const connectionResults = await Promise.allSettled(
          dbNames.map((dbName) =>
            initKnexClient({
              client: 'postgres',
              connection: this._dbConnections[dbName],
              pool: { ...DEFAULT_POOL_CONFIG, max: maxConnections },
            })
          )
        );

        const failedIdx = dbNames
          .map((_, i) => i)
          .filter((i) => connectionResults[i].status === 'rejected');

        if (failedIdx.length) {
          const errorDetails = failedIdx
            .map(
              (i) => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(connectionResults[i].reason)}`
            )
            .join('\n');

          await Promise.all(
            connectionResults
              .filter((r) => r.status === 'fulfilled')
              .map((r) => r.value.destroy())
          );

          throw new Error(`One or more databases failed to connect.\n${errorDetails}`);
        }

        const clients = Object.fromEntries(
          dbNames.map((name, idx) => [name, connectionResults[idx].value])
        );

        for (const [name, k] of Object.entries(clients)) wirePoolDebug(k, name);

        return clients;
    }

    _selectTargetPool(sql) {
        const gqlContext = graphqlCtx.getStore();
        const gqlOperationType = get(gqlContext, 'gqlOperationType');
        const gqlOperationName = get(gqlContext, 'gqlOperationName');

        const { sqlOperationName, tableName } = extractCRUDQueryData(sql);
        const context = { gqlOperationType, gqlOperationName, sqlOperationName, tableName };

        for (const rule of this._routingRules) {
          if (isRuleMatching(rule, context)) {
            return this._replicaPools[rule.target];
          }
        }

        logger.error({
          msg: 'None of routing rule matched SQL-query',
          sqlQuery: sql,
          meta: context,
        });
        throw new Error('None of routing rule matched SQL-query');
    }

    async _connect() {
        this._knexClients = await this._initKnexClients();

        this._replicaPools = Object.fromEntries(
          Object.entries(this._replicaPoolsConfig).map(([name, config]) => [
            name,
            new KnexPool({
              ...omit(config, ['databases']),
              knexClients: config.databases.map((dbName) => this._knexClients[dbName]),
            }),
          ])
        );

        const defaultRule = this._routingRules.find((rule) => isDefaultRule(rule));
        this._defaultPool = this._replicaPools[defaultRule.target];

        const defaultWritableDatabaseName = this._replicaPoolsConfig[defaultRule.target].databases[0];
        const fallbackConnection = this._dbConnections[defaultWritableDatabaseName];

        this.knex = await initKnexClient({
          client: 'postgres',
          connection: fallbackConnection,
          pool: { min: 0, max: 3, acquireTimeoutMillis: 15000, idleTimeoutMillis: 2000 },
        });
        wirePoolDebug(this.knex, 'keystone-fallback');

        this.knex.context.transaction = (...args) => {
          const defaultClient = this._defaultPool.getKnexClient();
          return defaultClient.context.transaction(...args);
        };

        const baseRunner = this.knex.client.runner.bind(this.knex.client);

        this.knex.client.runner = (builder) => {
          try {
            // ---- CRITICAL: respect transactions ---------------------------------
            // If inside a trx, do NOT route. Let knex use the transaction's connection.
            const trxClient =
              (builder && builder.client && builder.client.isTransaction) ? builder.client : null;
            const isInTrx = !!builder._transacting || !!trxClient;

            if (isInTrx) {
              return baseRunner(builder);
            }
            // ---------------------------------------------------------------------

            const sqlObject = builder.toSQL();

            // Batched queries => default writable pool (safe choice)
            if (Array.isArray(sqlObject)) {
              return this._defaultPool.getQueryRunner(builder);
            }

            // Normalize SQL with positional bindings so the router can parse it
            const sqlWithPositional = this.knex.client.positionBindings(sqlObject.sql);

            const selectedPool = this._selectTargetPool(sqlWithPositional);
            return selectedPool.getQueryRunner(builder);
          } catch (err) {
            logger.error({ msg: 'Unexpected error during SQL query routing', err });
            throw new Error(`Unexpected error during SQL query routing: ${String(err)}`);
          }
        };
    }

    async checkDatabaseVersion() {
        async function checkKnexDBVersion(knex, minVersion) {
          let version;
          try {
            const result = await knex.raw('SHOW server_version;');
            version = result.rows[0].server_version;
          } catch (err) {
            throw new Error(`Error reading version from postgresql: ${err}`);
          }

          if (!versionGreaterOrEqualTo(version, minVersion)) {
            throw new Error(
              `postgresql version ${version} is incompatible. Version ${minVersion} or later is required.`
            );
          }
        }

        const dbNames = Object.keys(this._knexClients);
        const results = await Promise.allSettled(
          dbNames.map((dbName) => checkKnexDBVersion(this._knexClients[dbName], this.minVer))
        );

        const failedIdx = dbNames
          .map((_, i) => i)
          .filter((i) => results[i].status === 'rejected');

        if (failedIdx.length) {
          const errorDetails = failedIdx
            .map((i) => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(results[i].reason)}`)
            .join('\n');

          if (this.knex) await this.knex.destroy();
          if (this._knexClients) {
            await Promise.all(Object.values(this._knexClients).map((k) => k.destroy()));
          }

          throw new Error(`One or more databases has non-supported versions.\n${errorDetails}`);
        }
    }

    async disconnect() {
        try {
          if (this.knex) {
            logPool(this.knex, 'keystone-fallback'); // optional peek
            await this.knex.destroy();
          }
        } finally {
          if (this._knexClients) {
            const entries = Object.entries(this._knexClients);
            for (const [name, k] of entries) logPool(k, name); // optional peek
            await Promise.all(entries.map(([_, k]) => k.destroy()));
          }
        }
    }
}

module.exports = {
    BalancingReplicaKnexAdapter,
}
