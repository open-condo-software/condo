const { PostgresDataProvider } = require('./postgresDataProvider')
const { PostgresSelectPlanner, POSTGRES_PROVIDER_CAPABILITIES } = require('./postgresSelectPlanner')
const { RedisDataProvider } = require('./redisDataProvider')
const { RedisSelectPlanner, REDIS_PROVIDER_CAPABILITIES } = require('./redisSelectPlanner')

function createSelectPlanner ({ provider = 'postgres', ...context }) {
    if (provider === 'postgres') {
        return new PostgresSelectPlanner(context)
    }
    if (provider === 'redis') {
        return new RedisSelectPlanner(context)
    }
    return null
}

function getProviderCapabilities (provider = 'postgres') {
    if (provider === 'postgres') {
        return POSTGRES_PROVIDER_CAPABILITIES
    }
    if (provider === 'redis') {
        return REDIS_PROVIDER_CAPABILITIES
    }
    return Object.freeze({
        provider,
        supportsSqlRouting: false,
        supportsCrossSourceSelectPlanning: false,
        supportsCrossSourceMutationPlanning: false,
        supportsCrossSourceSortPushdown: false,
    })
}

function createDataProvider ({ provider = 'postgres' } = {}) {
    if (provider === 'postgres') {
        return new PostgresDataProvider()
    }
    if (provider === 'redis') {
        return new RedisDataProvider()
    }
    return null
}

module.exports = {
    createSelectPlanner,
    createDataProvider,
    getProviderCapabilities,
}
