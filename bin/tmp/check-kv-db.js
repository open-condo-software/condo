const IORedis = require('ioredis')

async function checkKVDB ({
    connectionString,
    prefix,
    scanSize = 1_000,
    logEvery = 1_000_000,
}) {
    const client = new IORedis(connectionString)

    const size = await client.dbsize()
    console.log(`Database size: ${size} keys`)

    let cursor = '0'
    const nonMatching = []
    let scanned = 0
    let lastLogged = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [updatedCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', scanSize)
        cursor = updatedCursor
        scanned += keys.length

        if (scanned - lastLogged >= logEvery) {
            console.log(`${scanned} keys scanned`)
            lastLogged = scanned
        }

        nonMatching.push(...keys.filter(key => !key.startsWith(prefix)))

        if (cursor === '0') {
            console.log('All keys are successfully scanned!')
            break
        }
    }

    console.log(`Non-matching keys: ${JSON.stringify(nonMatching, null, 2)}`)
}

checkKVDB({
    connectionString: 'redis://127.0.0.1:6379/32',
    prefix: 'condo:',
}).then(() => {
    console.log('ALL DONE')
    process.exit(0)
})