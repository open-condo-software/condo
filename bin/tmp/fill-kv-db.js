const { faker } = require('@faker-js/faker')
const IORedis = require('ioredis')

function randInt (min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

async function fillKVDB ({
    connectionString,
    amount,
    prefixes = ['', '', 'condo:'], // 1/3 chance on "condo:"
    batch = 10_000,
    logEvery = 1_000_000,
}) {
    const client = new IORedis(connectionString)

    const iterations = Math.ceil(amount / batch)

    let lastLogged = 0
    let added = 0

    for (let i = 0; i < iterations; i++) {
        const data = Object.fromEntries(
            Array.from({ length: batch }, () => {
                const prefix = prefixes[randInt(0, prefixes.length)]
                return [prefix + faker.datatype.uuid(), faker.datatype.uuid()]
            })
        )

        await client.mset(data)

        added += batch

        if (added - lastLogged >= logEvery) {
            console.log(`${added} keys added`)
            lastLogged = added
        }
    }
}

// NOTE: Use docker stat to monitor memory consumption
fillKVDB({
    connectionString: 'redis://127.0.0.1:6379/32',
    amount: 40_000_000,
}).then(() => {
    console.log('ALL DONE')
    process.exit(0)
})