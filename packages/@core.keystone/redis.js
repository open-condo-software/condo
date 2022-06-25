const IORedis = require('ioredis')

const conf = require('@core/config')

const REDIS_CLIENTS = {}

/**
 * If you really need to use Redis then you should use this function!
 *
 * @param {string} name -- name of redis client or the task purpose
 * @param {'regular' | 'subscriber'} mode -- regular / subscriber redis client mode (read details: https://github.com/luin/ioredis#pubsub)
 * @return {import('ioredis')}
 */
function getRedisClient (name = 'default', mode = 'regular') {
    if (!name) throw new Error('getRedisClient() without client name')
    if (typeof name !== 'string') throw new Error('getRedisClient() name is not a string')
    if (mode !== 'regular' && mode !== 'subscriber') throw new Error('getRedisClient() mode should be regular or subscriber')
    const clientKey = name + mode
    if (!REDIS_CLIENTS[clientKey]) {
        const redisEnvName = `${name.toUpperCase()}_REDIS_URL`
        const redisUrl = conf[redisEnvName] || conf.REDIS_URL
        if (!redisUrl) throw new Error(`No REDIS_URL env! You need to set ${redisEnvName} / REDIS_URL env`)
        REDIS_CLIENTS[clientKey] = new IORedis(redisUrl, { connectionName: clientKey })
    }
    return REDIS_CLIENTS[clientKey]
}

module.exports = {
    getRedisClient,
}
