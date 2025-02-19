const fs = require('fs')
const path = require('path')
const { fileURLToPath } = require('url')

const Valkey = require('iovalkey')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const VALKEY_CLIENTS = {}

const getRedisPrefix = () => {
    const toPath = urlOrPath => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath

    const cwd = process.cwd()
    let stopAt = 'apps'
    let directory = path.resolve(toPath(cwd) ?? '')
    const { root } = path.parse(directory)
    stopAt = path.resolve(directory, toPath(stopAt) ?? root)
    let packageJsonPath

    while (directory && directory !== stopAt && directory !== root) {
        packageJsonPath = path.isAbsolute('package.json') ? 'package.json' : path.join(directory, 'package.json')

        try {
            const stats = fs.statSync(packageJsonPath, { throwIfNoEntry: false })
            if (stats?.isFile()) {
                break
            }
        } catch (e) { console.error(e) }

        directory = path.dirname(directory)
    }

    return require(packageJsonPath).name.split('/')
        .pop()
        .replace(/:/g, '')
        .replace(/-/g, '_') + ':'
}

const logger = getLogger('redis')
const PREFIX = getRedisPrefix()

/**
 * If you really need to use Redis then you should use this function!
 *
 * @param {string} name -- name of redis client or the task purpose (we can use a different REDIS_URL for each name)
 * @param {string} purpose -- regular / subscriber redis client mode (read details: https://github.com/luin/ioredis#pubsub); you can also use it if you need a two redis client with different settings; For example, the Bull is required three different redis clients
 * @param {string} opts -- RedisConfig to customize some client options; But please don't use it!
 * @param {boolean} ignorePrefix - this should be used when you need to specify your own keyPrefix (for example in bull.js)
 * @return {import('ioredis')}
 */
function getRedisClient (name = 'default', purpose = 'regular', opts = {}, ignorePrefix = false) {
    const clientKey = name + ':' + purpose

    logger.info({ msg: 'getRedisClient', clientKey, opts })

    if (!name) throw new Error('getRedisClient() without client name')
    if (typeof name !== 'string') throw new Error('getRedisClient() name is not a string')
    if (typeof purpose !== 'string') throw new Error('getRedisClient() purpose is not a string')
    if (!VALKEY_CLIENTS[clientKey]) {
        const redisEnvName = `${name.toUpperCase()}_REDIS_URL`
        const valkeyEnvName = `${name.toUpperCase()}_VALKEY_URL`
        let redisUrl = conf[valkeyEnvName] || conf[redisEnvName] || conf.VALKEY_URL || conf.REDIS_URL
        try {
            redisUrl = JSON.parse(redisUrl)
        } catch (err) {
            // skip that error
        }
        if (!redisUrl) throw new Error(`No REDIS_URL env! You need to set ${redisEnvName} / ${valkeyEnvName} / REDIS_URL / VALKEY_URL env`)
        // BUILD STEP! OR SOME CASE WITH REDIS_URL=undefined
        if (redisUrl === 'undefined') return undefined
        const clientOptions = { connectionName: clientKey, ...opts }
        if (!ignorePrefix) clientOptions['keyPrefix'] = PREFIX
        const client = typeof redisUrl === 'string' ? new Valkey(redisUrl, clientOptions) : new Valkey.Cluster(redisUrl, clientOptions)
        client.on('connect', () => logger.info({ msg: 'connect', clientKey }))
        client.on('close', () => logger.info({ msg: 'close', clientKey }))
        client.on('reconnecting', (waitTime) => logger.info({ msg: 'reconnecting', clientKey, waitTime }))
        client.on('error', (error) => logger.error({ msg: 'error', clientKey, error }))
        client.on('end', () => logger.error({ msg: 'end', clientKey }))
        VALKEY_CLIENTS[clientKey] = client
    }

    return VALKEY_CLIENTS[clientKey]
}

module.exports = {
    getRedisClient,
    getRedisPrefix,
}
