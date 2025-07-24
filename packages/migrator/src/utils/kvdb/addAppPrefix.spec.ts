import { faker } from '@faker-js/faker'
import IORedis from 'ioredis'
import { GenericContainer } from 'testcontainers'

import { addAppPrefix } from './addAppPrefix'

import type { Redis } from 'ioredis'
import type { StartedTestContainer } from 'testcontainers'

import { getAppPrefixedKey } from '@/utils/kvdb/keyPrefix'
import { generateAppKeys, fillKVDB, getNonMatchingCount, getAllKeys } from '@/utils/tests/kvdb'


const STARTUP_TIMEOUT_IN_MS = 5 * 60 * 1000 // 5 min
const CLEANUP_TIMEOUT_IN_MS = 30 * 1000 // 30 sec
// NOTE: It's expensive to keep all keys in memory, so first const is used for tests with equality, second - for scans
const SAFE_KEYS_SIZE = 100_000
const SAFE_KEYS_TIMEOUT_IN_MS = 30_000 // 30 sec is enough to fill db / run test / scan db on 100k keys scale
const BIG_KEYS_SIZE = 3_000_000
const BIG_KEYS_TIMEOUT_IN_MS = 75 * 1000 // 1 min

let currentDB = -1

function getRedisVirtualDBConnection (host: string, port: number): string {
    const dbIndex = ++currentDB
    return `redis://${host}:${port}/${dbIndex}`
}

const TASKS_QUEUES = ['tasks', 'low', 'high']

function randInt (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

function randomKeyPrefix (parts: number): string {
    return Array.from({ length: parts }, () => faker.random.alphaNumeric(randInt(3, 7))).join('_')
}

function getMatchers (keyPrefix: string, queueNames: Array<string>): Array<RegExp> {
    return [
        // NOTE: Test code
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        new RegExp(`^${keyPrefix}:.+$`),
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        ...queueNames.map(name => new RegExp(`^{${keyPrefix}:bull:${name}}:.+$`)),
    ]
}


describe('addAppPrefix', () => {
    let container: StartedTestContainer | undefined
    let client: Redis | undefined
    let port: number
    let host: string
    beforeAll(async () => {
        container = await new GenericContainer('redis').withExposedPorts(6379).start()
        port = container.getMappedPort(6379)
        host = container.getHost()
    }, STARTUP_TIMEOUT_IN_MS)
    afterAll(async () => {
        await client?.quit()
        await container?.stop()
    }, CLEANUP_TIMEOUT_IN_MS)

    test('Must add prefixes to all keys in db', async () => {
        const keyPrefix = randomKeyPrefix(2)
        const uniqueKeys = [...generateAppKeys(SAFE_KEYS_SIZE, TASKS_QUEUES)]
        const expectedKeys = uniqueKeys.map(key => getAppPrefixedKey(key, keyPrefix))

        const connectionString = getRedisVirtualDBConnection(host, port)
        const client = new IORedis(connectionString)
        const initialSize = await client.dbsize()
        expect(initialSize).toEqual(0)

        await fillKVDB({
            connectionString,
            keys: uniqueKeys,
            bullQueues: TASKS_QUEUES,
        })

        const size = await client.dbsize()
        expect(size).toEqual(expectedKeys.length)

        await addAppPrefix({
            connectionString,
            keyPrefix,
        })

        const nonMatchedKeysCount = await getNonMatchingCount({
            connectionString,
            matchers: getMatchers(keyPrefix, TASKS_QUEUES),
        })

        expect(nonMatchedKeysCount).toEqual(0)

        const allKeys = await getAllKeys({ connectionString })

        expect(allKeys.size).toEqual(expectedKeys.length)
        const nonExistingKeysCount = expectedKeys.filter(key => !allKeys.has(key)).length
        expect(nonExistingKeysCount).toEqual(0)
    }, SAFE_KEYS_TIMEOUT_IN_MS)
    test('Must be failure-proof (executed multiple times)', async () => {
        const keyPrefix = randomKeyPrefix(2)
        const uniqueKeys = [...generateAppKeys(SAFE_KEYS_SIZE, TASKS_QUEUES)]
        const expectedKeys = uniqueKeys.map(key => getAppPrefixedKey(key, keyPrefix))

        const connectionString = getRedisVirtualDBConnection(host, port)
        const client = new IORedis(connectionString)
        const initialSize = await client.dbsize()
        expect(initialSize).toEqual(0)

        const partialRenamedKeys = uniqueKeys.map(key => {
            if (Math.random() > 0.5) {
                return key
            }

            return getAppPrefixedKey(key, keyPrefix)
        })

        await fillKVDB({
            connectionString,
            keys: partialRenamedKeys,
            bullQueues: TASKS_QUEUES,
        })

        const size = await client.dbsize()
        expect(size).toEqual(expectedKeys.length)

        // First run on partially renamed db
        await addAppPrefix({
            connectionString,
            keyPrefix,
        })

        let nonMatchedKeysCount = await getNonMatchingCount({
            connectionString,
            matchers: getMatchers(keyPrefix, TASKS_QUEUES),
        })

        expect(nonMatchedKeysCount).toEqual(0)

        let allKeys = await getAllKeys({ connectionString })

        expect(allKeys.size).toEqual(expectedKeys.length)
        let nonExistingKeysCount = expectedKeys.filter(key => !allKeys.has(key)).length
        expect(nonExistingKeysCount).toEqual(0)

        // Second run on already renamed db
        await addAppPrefix({
            connectionString,
            keyPrefix,
        })

        nonMatchedKeysCount = await getNonMatchingCount({
            connectionString,
            matchers: getMatchers(keyPrefix, TASKS_QUEUES),
        })

        expect(nonMatchedKeysCount).toEqual(0)

        allKeys = await getAllKeys({ connectionString })

        expect(allKeys.size).toEqual(expectedKeys.length)
        nonExistingKeysCount = expectedKeys.filter(key => !allKeys.has(key)).length
        expect(nonExistingKeysCount).toEqual(0)
    }, SAFE_KEYS_TIMEOUT_IN_MS)

    describe('Must rename keys fast enough (stress test)', () => {
        describe('Standalone redis', () => {
            let connectionString: string
            beforeEach(async () => {
                connectionString = getRedisVirtualDBConnection(host, port)
                await fillKVDB({
                    connectionString,
                    keys: BIG_KEYS_SIZE,
                    bullQueues: TASKS_QUEUES,
                })
            }, STARTUP_TIMEOUT_IN_MS)
            test(`Keys: ${BIG_KEYS_SIZE}, timeout: ${BIG_KEYS_TIMEOUT_IN_MS}ms`, async () => {
                const keyPrefix = randomKeyPrefix(3)
                await addAppPrefix({
                    connectionString,
                    keyPrefix,
                })

                const nonMatchedKeysCount = await getNonMatchingCount({
                    connectionString,
                    matchers: getMatchers(keyPrefix, TASKS_QUEUES),
                })

                expect(nonMatchedKeysCount).toEqual(0)
            }, BIG_KEYS_TIMEOUT_IN_MS)
        })
    })
})