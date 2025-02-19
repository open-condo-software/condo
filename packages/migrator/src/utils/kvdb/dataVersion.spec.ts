import { faker } from '@faker-js/faker'
import IORedis from 'ioredis'
import { GenericContainer } from 'testcontainers'

import { updateDataVersion, DV_KEY } from './dataVersion'

import type { Redis } from 'ioredis'
import type { StartedTestContainer } from 'testcontainers'

const STARTUP_TIMEOUT_IN_MS = 5 * 60 * 1000 // 5 min
const CLEANUP_TIMEOUT_IN_MS = 30 * 1000 // 30 sec

describe('Data version utils', () => {
    let container: StartedTestContainer
    let client: Redis
    let connectionString: string
    beforeAll(async () => {
        container = await new GenericContainer('redis').withExposedPorts(6379).start()
        const host = container.getHost()
        const port = container.getMappedPort(6379)
        connectionString = `redis://${host}:${port}/0`
        client = new IORedis({ host, port, db: 0 })
    }, STARTUP_TIMEOUT_IN_MS)
    beforeEach(async () => {
        await client.flushall()
    })
    afterAll(async () => {
        await client.quit()
        await container.stop()
    }, CLEANUP_TIMEOUT_IN_MS)

    describe('updateDataVersion', () => {
        test('Must set prefixed key to specified version if key does not exist', async () => {
            const keyPrefix = faker.random.alphaNumeric(5)

            const result = await updateDataVersion({
                connectionString,
                keyPrefix,
                version: 2,
            })

            expect(result).toEqual(2)
            const value = await client.get(`${keyPrefix}:${DV_KEY}`)
            expect(value).toEqual('2')
        })
        test('Must set prefixed key to specified version if key value is lower', async () => {
            const keyPrefix = faker.random.alphaNumeric(5)

            await client.set(`${keyPrefix}:${DV_KEY}`, 1)

            const result = await updateDataVersion({
                connectionString,
                keyPrefix,
                version: 2,
            })

            expect(result).toEqual(2)
            const value = await client.get(`${keyPrefix}:${DV_KEY}`)
            expect(value).toEqual('2')
        })
        test('Must not set prefixed key to specified version if key value is higher', async () => {
            const keyPrefix = faker.random.alphaNumeric(5)

            await client.set(`${keyPrefix}:${DV_KEY}`, 3)

            const result = await updateDataVersion({
                connectionString,
                keyPrefix,
                version: 2,
            })

            expect(result).toEqual(3)
            const value = await client.get(`${keyPrefix}:${DV_KEY}`)
            expect(value).toEqual('3')
        })
        test('Must override prefixed key to specified version if key is not integer', async () => {
            const keyPrefix = faker.random.alphaNumeric(5)

            await client.set(`${keyPrefix}:${DV_KEY}`, 'something-random')

            const result = await updateDataVersion({
                connectionString,
                keyPrefix,
                version: 2,
            })

            expect(result).toEqual(2)
            const value = await client.get(`${keyPrefix}:${DV_KEY}`)
            expect(value).toEqual('2')
        })
    })
})