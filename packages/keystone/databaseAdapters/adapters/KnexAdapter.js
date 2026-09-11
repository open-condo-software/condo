const { KnexAdapter: OriginalKnexAdapter } = require('@open-keystone/adapter-knex')
const { knex } = require('knex')

const { reconcileCrossPoolConstraints } = require('@open-condo/keystone/databaseAdapters/utils')
const { getLogger } = require('@open-condo/keystone/logging')

class KnexAdapter extends OriginalKnexAdapter {
    /**
     * Override _connect to fix error handling and add proper resource cleanup.
     * Original implementation uses flawed .catch() pattern that transforms rejections
     * into resolutions and doesn't clean up knex client on connection failure.
     */
    async _connect () {
        const { knexOptions = {} } = this.config
        const { connection } = knexOptions
        let knexConnection = connection || process.env.DATABASE_URL

        if (!knexConnection) {
            throw new Error('No Knex connection URI specified.')
        }
        this.knex = knex({
            client: this.client,
            connection: knexConnection,
            ...knexOptions,
        })

        try {
            await this.knex.raw('select 1+1 as result')
            return true
        } catch (connectionError) {
            await this.knex.destroy().catch(() => {
                // Ignore cleanup errors, prioritize original error
            })

            let dbName
            if (typeof knexConnection === 'string') {
                const parts = knexConnection.split('/')
                dbName = parts.pop() || knexConnection
            } else {
                dbName = knexConnection.database || knexConnection.host || 'unknown'
            }

            const logger = getLogger()
            logger.error({ msg: 'Could not connect to database', data: { dbName } })
            throw connectionError
        }
    }

    /**
     * Restore FK constraints that a previous multi-database topology had to drop
     * (kmigrator post-migrate).
     *
     * Everything lives in one database here, so no constraint can be cross-database: this
     * only re-adds what `BalancingReplicaKnexAdapter` recorded before, which makes moving a
     * table back onto a single database a plain `migrate`.
     *
     * @returns {Promise<Array<{ dbName: string, dropped: Array, restored: Array }>>}
     */
    async __kmigratorReconcileTopology () {
        const schemaName = typeof this.getDbSchemaName === 'function' ? this.getDbSchemaName() : 'public'
        const dbName = typeof this.knex?.client?.database === 'function'
            ? this.knex.client.database()
            : undefined

        return [await reconcileCrossPoolConstraints({
            knex: this.knex,
            resolveTableDatabase: () => 'default',
            schemaName,
            dbName,
        })]
    }
}

module.exports = { KnexAdapter }
