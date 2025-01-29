
const fs = require('fs')
const path = require('path')
const { fileURLToPath } = require('url')

const IORedis = require('ioredis')
const { get } = require('lodash')

const conf = require('@open-condo/config')

const { getLogger } = require('./logging')

const READONLY_COMMANDS = ['bitcount', 'bitfield_ro', 'bitpos', 'dbsize', 'dump', 'eval_ro', 'evalsha_ro', 'exists', 'expiretime', 'fcall_ro', 'geodist', 'geohash', 'geopos', 'georadius_ro', 'georadiusbymember_ro', 'geosearch', 'get', 'getbit', 'getrange', 'hexists', 'hget', 'hgetall', 'hkeys', 'hlen', 'hmget', 'hrandfield', 'hscan', 'hstrlen', 'hvals', 'keys', 'lcs', 'lindex', 'llen', 'lolwut', 'lpos', 'lrange', 'mget', 'pexpiretime', 'pfcount', 'pttl', 'randomkey', 'scan', 'scard', 'sdiff', 'sinter', 'sintercard', 'sismember', 'smembers', 'smismember', 'sort_ro', 'srandmember', 'sscan', 'strlen', 'substr', 'sunion', 'touch', 'ttl', 'type', 'xlen', 'xpending', 'xrange', 'xread', 'xrevrange', 'zcard', 'zcount', 'zdiff', 'zinter', 'zintercard', 'zlexcount', 'zmscore', 'zrandmember', 'zrange', 'zrangebylex', 'zrangebyscore', 'zrank', 'zrevrange', 'zrevrangebylex', 'zrevrangebyscore', 'zrevrank', 'zscan', 'zscore', 'zunion']


const REDIS_CLIENTS = {}

const getRedisPrefix = () => {
    const toPath = urlOrPath => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath

    function findUpSync (name) {
        const cwd = process.cwd()
        const type = 'file'
        let stopAt = 'apps'
        let directory = path.resolve(toPath(cwd) ?? '')
        const { root } = path.parse(directory)
        stopAt = path.resolve(directory, toPath(stopAt) ?? root)

        while (directory && directory !== stopAt && directory !== root) {
            const filePath = path.isAbsolute(name) ? name : path.join(directory, name)

            try {
                const stats = fs.statSync(filePath, { throwIfNoEntry: false })
                if ((type === 'file' && stats?.isFile()) || (type === 'directory' && stats?.isDirectory())) {
                    return filePath
                }
            } catch (e) { console.error(e) }

            directory = path.dirname(directory)
        }
    }

    return require(findUpSync('package.json')).name.split('/').pop() + ':'
}

const logger = getLogger('redis')
const PREFIX = getRedisPrefix()

if (get(conf, 'REDIS_FALLBACK_ENABLED', 'false') === 'true') {
    const originalSendCommand = IORedis.prototype.sendCommand
    IORedis.prototype.sendCommand = function (...args) {
        const [command] = args

        if (!READONLY_COMMANDS.includes(command.name)) {
            return originalSendCommand.apply(this, args)
        }

        const [prefixedKey, ...restArgs] = command.args

        return new Promise((resolve, reject) => {
            originalSendCommand.apply(this, args).then((value) => {
                if (value !== null || !prefixedKey.startsWith(PREFIX)) {
                    resolve(value)
                } else {
                    const nonPrefixedKey = prefixedKey.substring(PREFIX.length)

                    const otherCommand = new IORedis.Command(command.name, [nonPrefixedKey, ...restArgs], 'utf-8')

                    originalSendCommand.apply(this, [otherCommand]).then((result) => {
                        if (result instanceof Buffer) {
                            resolve(result.toString('utf8'))
                        }
                        resolve(result)

                    }).catch(reject)
                }
            }).catch(reject)
        })
    }
}

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
        const client = new IORedis(redisUrl, { connectionName: clientKey, keyPrefix: PREFIX, ...opts })
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
    getRedisPrefix,
}
