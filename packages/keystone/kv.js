const IORedis = require('ioredis')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const KV_CLIENTS = {}
const logger = getLogger('kv')

/**
 * If you really need to use key-value storage client then you should use this function!
 *
 * @param {string} name -- name of key-value storage client or the task purpose (we can use a different KV_URL for each name)
 * @param {string} purpose -- regular / subscriber key-value storage client mode (read details: https://github.com/luin/ioredis#pubsub); you can also use it if you need a two kv client with different settings; For example, the Bull is required three different kv clients
 * @param {Object} opts -- key-value storage config to customize some client options; But please don't use it!
 * @return {import('ioredis')}
 */
function getKVClient (name = 'default', purpose = 'regular', opts = {}) {
    const clientKey = name + ':' + purpose

    logger.info({ msg: 'getKVClient', clientKey, opts })

    if (!name) throw new Error('getKVClient() without client name')
    if (typeof name !== 'string') throw new Error('getKVClient() name is not a string')
    if (typeof purpose !== 'string') throw new Error('getKVClient() purpose is not a string')
    if (!KV_CLIENTS[clientKey]) {
        const kvEnvName = `${name.toLowerCase()}_KV_URL`
        const redisEnvName = `${name.toUpperCase()}_REDIS_URL`
        const kvUrl = conf[kvEnvName] || conf[redisEnvName] || conf.KV_URL || conf.REDIS_URL

        if (!kvUrl) throw new Error(`No KV_URL or REDIS_URL env! You need to set ${kvEnvName} / KV_URL / ${redisEnvName} / REDIS_URL env`)
        // BUILD STEP! OR SOME CASE WITH REDIS_URL=undefined
        if (kvUrl === 'undefined') return undefined
        const client = new IORedis(kvUrl, { connectionName: clientKey, ...opts })
        client.on('connect', () => logger.info({ msg: 'connect', clientKey }))
        client.on('close', () => logger.info({ msg: 'close', clientKey }))
        client.on('reconnecting', (waitTime) => logger.info({ msg: 'reconnecting', clientKey, waitTime }))
        client.on('error', (error) => logger.error({ msg: 'error', clientKey, error }))
        client.on('end', () => logger.error({ msg: 'end', clientKey }))
        KV_CLIENTS[clientKey] = client
    }

    return KV_CLIENTS[clientKey]
}

module.exports = {
    getKVClient,
}
