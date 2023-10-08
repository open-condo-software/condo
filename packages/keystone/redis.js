const IORedis = require('ioredis')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const REDIS_CLIENTS = {}
const logger = getLogger('redis')

/**
 * If you really need to use Redis then you should use this function!
 *
 * @param {string} name -- name of redis client or the task purpose (we can use a different REDIS_URL for each name)
 * @param {string} purpose -- regular / subscriber redis client mode (read details: https://github.com/luin/ioredis#pubsub); you can also use it if you need a two redis client with different settings; For example, the Bull is required three different redis clients
 * @param {string} opts -- RedisConfig to customize some client options; But please don't use it!
 * @return {import('ioredis')}
 */
function getRedisClient (name = 'default', purpose = 'regular', opts = {}) {
    const clientKey = name + ':' + purpose

    logger.info({ msg: 'getRedisClient', clientKey, opts })

    if (!name) throw new Error('getRedisClient() without client name')
    if (typeof name !== 'string') throw new Error('getRedisClient() name is not a string')
    if (typeof purpose !== 'string') throw new Error('getRedisClient() purpose is not a string')
    if (!REDIS_CLIENTS[clientKey]) {
        const redisEnvName = `${name.toUpperCase()}_REDIS_URL`
        const redisUrl = conf[redisEnvName] || conf.REDIS_URL
        if (!redisUrl) throw new Error(`No REDIS_URL env! You need to set ${redisEnvName} / REDIS_URL env`)
        // BUILD STEP! OR SOME CASE WITH REDIS_URL=undefined
        if (redisUrl === 'undefined') return undefined
        const client = new IORedis(redisUrl, { connectionName: clientKey, ...opts })
        client.on('connect', () => logger.info({ msg: 'connect', clientKey }))
        client.on('close', () => logger.info({ msg: 'close', clientKey }))
        client.on('reconnecting', (waitTime) => logger.info({ msg: 'reconnecting', clientKey, waitTime }))
        client.on('error', (error) => logger.error({ msg: 'error', clientKey, error }))
        client.on('end', () => logger.error({ msg: 'end', clientKey }))
        REDIS_CLIENTS[clientKey] = client
    }

    return REDIS_CLIENTS[clientKey]
}

module.exports = {
    getRedisClient,
}
