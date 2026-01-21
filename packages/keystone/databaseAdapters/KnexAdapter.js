const { KnexAdapter: OriginalKnexAdapter } = require('@open-keystone/adapter-knex')
const { knex } = require('knex')

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
        let knexConnection =
            connection || process.env.CONNECT_TO || process.env.DATABASE_URL || process.env.KNEX_URI

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
}

module.exports = { KnexAdapter }
