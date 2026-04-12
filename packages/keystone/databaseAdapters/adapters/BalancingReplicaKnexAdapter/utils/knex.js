const { knex } = require('knex')

/**
 * Initializes knex client with specified options and tests connection status
 * same as in default knex adapter:
 * https://github.com/keystonejs/keystone-5/blob/ee00f7fbac9e25364f2d96f4105e02e236fcf5a0/packages/adapter-knex/lib/adapter-knex.js#L47
 * @param options - knex options
 * @returns {Promise<import('knex').knex<any, unknown[]>>}
 */
async function initKnexClient (options) {
    const client = knex(options)

    try {
        await client.raw('select 1+1 as result')
        return client
    } catch (error) {
        await client.destroy().catch(() => {
            // Ignore cleanup errors, prioritize original error
        })
        throw error
    }
}

module.exports = {
    initKnexClient,
}