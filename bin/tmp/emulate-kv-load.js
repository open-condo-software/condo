const { faker } = require('@faker-js/faker')
const IORedis = require('ioredis')

function randInt (min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}

async function sleep (ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(ms), ms)
    })
}

async function emulateKvLoad ({
    connectionString,
    prefixes = [''],
    durationInMS = 90_000,
    sleepIntervalInMS = 500,
}) {
    const client = new IORedis(connectionString)

    const iterations = Math.floor(durationInMS / sleepIntervalInMS) + 1

    for (let i = 0; i < iterations; i++) {
        const rndIdx = randInt(0, prefixes.length)
        const prefix = prefixes[rndIdx]
        const key = prefix + faker.datatype.uuid()

        await client.set(key, faker.datatype.uuid())
        console.log(`SET ${key}`)

        await sleep(sleepIntervalInMS)
    }
}

emulateKvLoad({
    connectionString: 'redis://127.0.0.1:6379/32',
    prefixes: ['load:', 'condo:'],
}).then(() => {
    console.log('ALL DONE')
    process.exit(0)
})