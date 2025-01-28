const Redis = require('ioredis')

const conf = require('@open-condo/config')
const { getRedisPrefix } = require('@open-condo/keystone/redis')


if (conf['REDIS_URL'] === undefined) {
    throw new Error('Redis URL missing. You should specify a REDIS_URL env variable for establishing connection')
}

const client = new Redis(conf['REDIS_URL'])
let REDIS_KEY_PREFIX = getRedisPrefix()

const renameRedisKeys = async ({ direction, stepSize = 1000 }) => {
    const size = await client.dbsize()
    console.log('database size -> ', size)
    console.log('key prefix -> ', REDIS_KEY_PREFIX)
    let cursor = '0'
    const iters = Math.ceil(size / stepSize)

    for (const i of Array.from({ length: iters })) {
        const [newCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', stepSize)
        cursor = newCursor

        if (keys.length) {
            const multi = client.multi()

            const filterQuery = direction === 'forward'
                ? (key) => !key.startsWith(REDIS_KEY_PREFIX)
                : (key) => key.startsWith(REDIS_KEY_PREFIX)
            keys.filter(filterQuery).forEach((key) => {
                if (direction === 'forward') {
                    multi.renamenx(key, REDIS_KEY_PREFIX + key)
                } else {
                    multi.renamenx(key, key.substring(REDIS_KEY_PREFIX.length))
                }
            })

            const result = await multi.exec()

            console.log('renamed batch length -> ', result.length)
        }

        if (newCursor === 0 || newCursor === '0') {
            console.log('No more keys found -> stopping execution')
            break
        }
    }
}

module.exports = {
    renameRedisKeys,
}
