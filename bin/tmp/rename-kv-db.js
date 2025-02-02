const IORedis = require('ioredis')

async function renameKVDB ({
    connectionString,
    fromPrefix = '',
    toPrefix = '',
    logEvery = 100_000,
    scanSize = 1_000,
}) {
    console.time('rename')
    console.log(`Renaming keys with "${fromPrefix}" prefix to "${toPrefix}"`)
    const client = new IORedis(connectionString)

    const size = await client.dbsize()
    console.log(`Database size: ${size} keys`)



    let cursor = '0'
    let renamed = 0
    let lastLogged = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [updatedCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', scanSize)
        cursor = updatedCursor

        let tx = client.multi()

        for (const key of keys) {
            // NOTE: exclude non-matching keys if fromPrefix specified
            if (fromPrefix.length && !key.startsWith(fromPrefix)) {
                continue
            }

            // NOTE: skip already renamed keys
            if (toPrefix.length && key.startsWith(toPrefix)) {
                continue
            }

            tx = tx.renamenx(key, toPrefix + key.substring(fromPrefix.length))
            renamed++
        }

        await tx.exec()

        if (renamed - lastLogged >= logEvery) {
            console.log(`${renamed} keys renamed`)
            lastLogged = renamed
        }

        if (cursor === '0') {
            console.log('All keys are successfully scanned!')
            break
        }
    }

    console.log(`${renamed} keys renamed`)

    console.timeEnd('rename')
}

renameKVDB({
    connectionString: 'redis://127.0.0.1:6379/32',
    toPrefix: 'condo:',
}).then(() => {
    console.log('ALL DONE')
    process.exit(0)
})