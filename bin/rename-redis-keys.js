const Redis = require('ioredis')

const conf = require('@open-condo/config')
const { getRedisPrefix } = require('@open-condo/keystone/redis')


if (conf['REDIS_URL'] === undefined) {
    throw new Error('Redis URL missing. You should specify a REDIS_URL env variable for establishing connection')
}

const client = new Redis(conf['REDIS_URL'])
let REDIS_KEY_PREFIX = getRedisPrefix()

const renameRedisKeys = async ({ stepSize = 1000, fromPrefix = '', toPrefix = REDIS_KEY_PREFIX }) => {
    const size = await client.dbsize()
    console.log('database size -> ', size)
    console.log('rename from -> ', fromPrefix, ' to key prefix -> ', toPrefix)
    let cursor = '0'

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [newCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', stepSize)
        cursor = newCursor
        const transaction = client.multi()

        for (const key of keys) {
            if (fromPrefix.length && !key.startsWith(fromPrefix)) continue
            if (toPrefix.length && key.startsWith(toPrefix)) continue

            transaction.renamenx(key, toPrefix + key.substring(fromPrefix.length))
        }
        await transaction.exec()

        if (cursor === '0') {
            console.log('All keys successfully renamed')
            break
        }
    }
}

module.exports = {
    renameRedisKeys,
}
