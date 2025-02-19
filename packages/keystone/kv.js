const fs = require('fs')
const path = require('path')
const { fileURLToPath } = require('url')

const IORedis = require('ioredis')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const KV_CLIENTS = {}
const logger = getLogger('kv')

const getKVPrefix = () => {
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

const PREFIX = getKVPrefix()

/**
 * If you really need to use key-value storage client then you should use this function!
 *
 * @param {string} name -- name of key-value storage client or the task purpose (we can use a different KV_URL for each name)
 * @param {string} purpose -- regular / subscriber key-value storage client mode (read details: https://github.com/luin/ioredis#pubsub); you can also use it if you need a two kv client with different settings; For example, the Bull is required three different kv clients
 * @param {Object} opts -- client config such as internal API for storages and custom @open-condo specific ones
 * @param {Object} opts.kvOptions -- key-value storage config to customize some client options; But please don't use it!
 * @param {boolean} opts.ignorePrefix -- special option for disable prepending app specific prefix to all key operations. Using this flag in the enabled state should only be done if you understand how the cluster works, as well as eliminating incompatibility with third-party libraries by setting your own prefix
 * @return {import('ioredis')}
 */
function getKVClient (name = 'default', purpose = 'regular', opts = { kvOptions: {}, ignorePrefix: false }) {
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

        const clientOptions = { connectionName: clientKey, ...opts.kvOptions }
        if (!opts.ignorePrefix) clientOptions['keyPrefix'] = PREFIX

        const client = new IORedis(kvUrl, clientOptions)

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
    getKVPrefix,
}
