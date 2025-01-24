const Redis = require('ioredis')

const conf = require('@open-condo/config')

if (conf['REDIS_URL'] === undefined) {
    throw new Error('Redis URL missing. You should specify a REDIS_URL env variable for establishing connection')
}

const client = new Redis(conf['REDIS_URL'])
const REDIS_KEY_PREFIX = process.cwd().split('/').pop() + ':'

const renameRedisKeys = async ({ direction, stepSize = 1000 }) => {
    const size = await client.dbsize()
    console.log('database size -> ', size)
    console.log('key prefix -> ', REDIS_KEY_PREFIX)
    let cursor = '0'
    const iters = Math.ceil(size / stepSize)

    for (const i of Array.from({ length: iters })) {
        if (i % 100 === 0) {
            console.log(`I=${i}/${iters}`)
        }

        const [newCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', stepSize)
        console.log('newCursor -> ', newCursor)
        console.log('keys count -> ', keys.length)
        cursor = newCursor

        if (keys.length) {
            const multi = client.multi()

            const filterQuery = direction === 'forward'
                ? (key) => !key.startsWith(REDIS_KEY_PREFIX)
                : (key) => key.startsWith(REDIS_KEY_PREFIX)
            keys.filter(filterQuery).forEach((key) => {
                if (direction === 'forward') {
                    multi.rename(key, REDIS_KEY_PREFIX + key)
                } else {
                    multi.rename(key, key.substring(REDIS_KEY_PREFIX.length))
                }
            })

            const result = await multi.exec()

            console.log('rename for batch result -> ', result.length)
        }

        if (newCursor === 0 || newCursor === '0') {
            console.log('CURSOR=0 -> stopping execution')
            break
        }
    }
}

module.exports = {
    renameRedisKeys,
}
