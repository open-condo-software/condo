const IORedis = require('ioredis')
const pino = require('pino')
const falsey = require('falsey')

const conf = require('@core/config')

const REDIS_CLIENTS = {}
const redisLogger = pino({ name: 'redis', enabled: falsey(conf.DISABLE_LOGGING) })

/**
 * If you really need to use Redis then you should use this function!
 *
 * @param {string} name -- name of redis client or the task purpose (we can use a different REDIS_URL for each name)
 * @param {string} mode -- regular / subscriber redis client mode (read details: https://github.com/luin/ioredis#pubsub); you can also use it if you need a two redis client with different settings
 * @param {string} opts -- RedisConfig to customize some client options; But please use don't use it!
 * @return {import('ioredis')}
 */
function getRedisClient (name = 'default', mode = 'regular', opts = {}) {
    redisLogger.info({ message: 'getRedisClient', name, mode })
    if (!name) throw new Error('getRedisClient() without client name')
    if (typeof name !== 'string') throw new Error('getRedisClient() name is not a string')
    if (typeof mode !== 'string') throw new Error('getRedisClient() name is not a string')
    const clientKey = name + ':' + mode
    if (!REDIS_CLIENTS[clientKey]) {
        const redisEnvName = `${name.toUpperCase()}_REDIS_URL`
        const redisUrl = conf[redisEnvName] || conf.REDIS_URL
        if (!redisUrl) throw new Error(`No REDIS_URL env! You need to set ${redisEnvName} / REDIS_URL env`)
        const client = new IORedis(redisUrl, { connectionName: clientKey, ...opts })
        client.on('connect', () => redisLogger.info({ eventName: 'connect', name, mode }))
        client.on('close', () => redisLogger.info({ eventName: 'close', name, mode }))
        client.on('reconnecting', (waitTime) => redisLogger.info({ eventName: 'reconnecting', name, mode, waitTime }))
        client.on('error', (error) => redisLogger.error({ eventName: 'error', name, mode, error }))
        client.on('end', () => redisLogger.error({ eventName: 'end', name, mode }))
        REDIS_CLIENTS[clientKey] = client
    }
    return REDIS_CLIENTS[clientKey]
}

module.exports = {
    getRedisClient,
}
