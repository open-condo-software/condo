import { faker } from '@faker-js/faker'
import IORedis from 'ioredis'

function randInt (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

function getRandomSubKey (parts: number): string {
    return Array.from({ length: parts }, () => faker.random.alphaNumeric(randInt(3, 10))).join(':')
}

function generateRandomAppKey (bullQueues: Array<string>): string {
    // NOTE: Non-bull case
    if (Math.random() <= 0.5) {
        return getRandomSubKey(randInt(1, 5))
    }

    const queueName = bullQueues[randInt(0, bullQueues.length)]
    return `bull:${queueName}:${getRandomSubKey(randInt(1, 3))}`
}

type FillKVDBOptions = {
    connectionString: string
    keys: number | Array<string>
    bullQueues?: Array<string>
    batch?: number
}

export function generateAppKeys (amount: number, bullQueues: Array<string>): Set<string> {
    return new Set(Array.from({ length: amount }, () => generateRandomAppKey(bullQueues)))
}

export async function fillKVDB (options: FillKVDBOptions): Promise<void> {
    const {
        connectionString,
        keys,
        batch = 10_000,
        bullQueues = ['tasks', 'low', 'high'],
    } = options
    const client = new IORedis(connectionString)

    if (typeof keys === 'number') {
        for (let i = 0; i < keys; i += batch) {
            const batchSize = Math.min(keys - i, batch)

            const data = Object.fromEntries(Array.from({ length: batchSize }, () => [
                generateRandomAppKey(bullQueues),
                faker.datatype.uuid(),
            ]))

            await client.mset(data)
        }
    } else {
        for (let i = 0; i < keys.length; i += batch) {
            const batchSize = Math.min(keys.length - i, batch)

            const keysSlice = keys.slice(i, i + batchSize)
            const data = Object.fromEntries(keysSlice.map((key) => [
                key,
                faker.datatype.uuid(),
            ]))

            await client.mset(data)
        }
    }

    await client.quit()
}

type CommonScanOptions = {
    connectionString: string
    scanSize?: number
}

type ScanKVDBOptions = CommonScanOptions & {
    processKeyBatch: (keys: Array<string>) => void
}

export async function scanKVDB (options: ScanKVDBOptions): Promise<void> {
    const {
        connectionString,
        processKeyBatch,
        scanSize = 1_000,
    } = options

    const client = new IORedis(connectionString)

    let cursor = '0'

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [updatedCursor, keys] = await client.scan(cursor, 'MATCH', '*', 'COUNT', scanSize)
        cursor = updatedCursor

        processKeyBatch(keys)

        if (cursor === '0') {
            console.log('All keys are successfully scanned!')
            break
        }
    }

    await client.quit()
}

export async function getAllKeys (options: CommonScanOptions): Promise<Set<string>> {
    const allKeys: Set<string> = new Set()

    const processKeyBatch = (keys: Array<string>) => {
        keys.forEach(key => allKeys.add(key))
    }

    await scanKVDB({
        ...options,
        processKeyBatch,
    })

    return allKeys
}

type GetNonMatchingCountOptions = CommonScanOptions & {
    matchers: Array<RegExp>
}

export async function getNonMatchingCount (options: GetNonMatchingCountOptions): Promise<number> {
    const { matchers, ...rest } = options
    let nonMatching = 0

    const processKeyBatch = (keys: Array<string>) => {
        nonMatching += keys.filter(key => !matchers.some(matcher => matcher.test(key))).length
    }

    await scanKVDB({
        ...rest,
        processKeyBatch,
    })

    return nonMatching
}