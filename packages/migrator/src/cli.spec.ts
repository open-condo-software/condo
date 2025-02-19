import path from 'path'

import execa from 'execa'
import IORedis from 'ioredis'
import { GenericContainer } from 'testcontainers'

import type { Monorepo } from '@/utils/tests/repo'
import type { ExecaReturnValue, Options as ExecaOptions } from 'execa'
import type { Redis } from 'ioredis'
import type { StartedTestContainer } from 'testcontainers'

import { DV_KEY } from '@/utils/kvdb/dataVersion'
import { getAppKeyPrefix, getAppPrefixedKey } from '@/utils/kvdb/keyPrefix'
import { generateAppKeys, fillKVDB, getAllKeys } from '@/utils/tests/kvdb'
import { createTestMonoRepo } from '@/utils/tests/repo'

function expectSuccessfulExecution (result: ExecaReturnValue) {
    const { stdout, stderr, exitCode } = result
    expect(exitCode).toEqual(0)
    expect(stderr).toBe('')
    expect(stdout).not.toBe('')
}

let currentDB = -1

function getRedisVirtualDBConnection (host: string, port: number): string {
    const dbIndex = ++currentDB
    return `redis://${host}:${port}/${dbIndex}`
}

const DB_SIZE = 50_000 // Big sizes are tested outside this module
const STARTUP_TIMEOUT_IN_MS = 5 * 60 * 1000 // 5 min
const CLEANUP_TIMEOUT_IN_MS = 30 * 1000 // 30 sec
const TEST_TIMEOUT_IN_MS = 30_000 // 30 sec is enough to fill db / run test / scan db on 50k keys scale
const BULL_QUEUES = ['tasks', 'low', 'high']


describe('End to end CLI tests', () => {
    let repo: Monorepo | undefined
    let cliPath: string

    async function runMigrator (args: Array<string>, options: ExecaOptions): Promise<ExecaReturnValue> {
        return execa('node', [cliPath, ...args], options)
    }

    beforeAll(() => {
        cliPath = path.join(process.cwd(), 'dist/cli.js')
    })
    afterEach(() => {
        repo?.destroy()
    })
    describe('Global', () => {
        test('CLI must have --help option', async () => {
            repo = createTestMonoRepo()
                .createApp()
                .createApp()

            const result = await runMigrator(['--help'], { cwd: repo.rootDir.name })
            expectSuccessfulExecution(result)
        })
    })
    describe('Commands', () => {
        describe('add-apps-kv-prefixes', () => {
            const command = 'add-apps-kv-prefixes'
            let container: StartedTestContainer | undefined
            let port: number
            let host: string
            let client: Redis | undefined

            beforeAll(async () => {
                container = await new GenericContainer('redis').withExposedPorts(6379).start()
                port = container.getMappedPort(6379)
                host = container.getHost()
            }, STARTUP_TIMEOUT_IN_MS)

            afterAll(async () => {
                await client?.quit()
                await container?.stop()
            }, CLEANUP_TIMEOUT_IN_MS)

            test('Must have --help page which does not affect any DBs', async () => {
                const connectionString = getRedisVirtualDBConnection(host, port)
                const dummyKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES)]

                await fillKVDB({
                    connectionString,
                    keys: dummyKeys,
                })

                client = new IORedis(connectionString)
                const initialSize = await client.dbsize()
                expect(initialSize).toEqual(dummyKeys.length)

                repo = createTestMonoRepo()
                    .createApp({
                        env: { REDIS_URL: connectionString },
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })

                const result = await runMigrator([command, '--help'], { cwd: repo.rootDir.name })
                expectSuccessfulExecution(result)

                const finalSize = await client.dbsize()
                expect(finalSize).toEqual(initialSize)
                const allKeys = await getAllKeys({ connectionString })
                const missingKeys = dummyKeys.filter(key => !allKeys.has(key))
                expect(missingKeys).toHaveLength(0)
            }, TEST_TIMEOUT_IN_MS)

            test('Must migrate multiple databases when executed from repo root', async () => {
                const firstAppName = '@app/first-app'
                const secondAppName = '@app/second-app'
                const noKSApp = '@app/no-ks-app'
                const noEnvApp = '@app/no-env-app'

                const firstAppConnection = getRedisVirtualDBConnection(host, port)
                const secondAppConnection = getRedisVirtualDBConnection(host, port)

                const firstAppKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES).add(DV_KEY)]
                const secondAppKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES).add(DV_KEY)]

                const firstAppKeyPrefix = getAppKeyPrefix(firstAppName)
                const secondAppKeyPrefix = getAppKeyPrefix(secondAppName)

                const firstAppExpectedKeys = firstAppKeys.map(key => getAppPrefixedKey(key, firstAppKeyPrefix))
                const secondAppExpectedKeys = secondAppKeys.map(key => getAppPrefixedKey(key, secondAppKeyPrefix))

                await fillKVDB({
                    connectionString: firstAppConnection,
                    keys: firstAppKeys,
                })
                await fillKVDB({
                    connectionString: secondAppConnection,
                    keys: secondAppKeys,
                })

                repo = createTestMonoRepo()
                    .createApp({
                        name: firstAppName,
                        env: { REDIS_URL: firstAppConnection },
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })
                    .createApp({
                        name: secondAppName,
                        env: { REDIS_URL: secondAppConnection },
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })
                    .createApp({
                        name: noKSApp,
                        env: { REDIS_URL: secondAppConnection },
                    })
                    .createApp({
                        name: noEnvApp,
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })

                const result = await runMigrator([command, '-y'], { cwd: repo.rootDir.name })
                expectSuccessfulExecution(result)

                const firstAppTransformedKeys = await getAllKeys({ connectionString: firstAppConnection })
                const secondAppTransformedKeys = await getAllKeys({ connectionString: secondAppConnection })

                expect(firstAppTransformedKeys.size).toEqual(firstAppExpectedKeys.length)
                expect(secondAppTransformedKeys.size).toEqual(secondAppExpectedKeys.length)

                const missingFirstAppKeys = firstAppExpectedKeys.filter(key => !firstAppTransformedKeys.has(key))
                expect(missingFirstAppKeys).toHaveLength(0)

                const missingSecondAppKeys = secondAppExpectedKeys.filter(key => !secondAppTransformedKeys.has(key))
                expect(missingSecondAppKeys).toHaveLength(0)

                const firstClient = new IORedis(firstAppConnection)
                const firstAppDV = await firstClient.get(getAppPrefixedKey(DV_KEY, firstAppKeyPrefix))
                expect(firstAppDV).toEqual('2')
                await firstClient.quit()

                const secondClient = new IORedis(secondAppConnection)
                const secondAppDV = await secondClient.get(getAppPrefixedKey(DV_KEY, secondAppKeyPrefix))
                expect(secondAppDV).toEqual('2')
                await secondClient.quit()
            }, TEST_TIMEOUT_IN_MS)

            test('Must migrate single database when executed from app directory', async () => {
                const firstAppName = '@app/first-app'
                const secondAppName = '@app/second-app'

                const firstAppConnection = getRedisVirtualDBConnection(host, port)
                const secondAppConnection = getRedisVirtualDBConnection(host, port)

                const firstAppKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES).add(DV_KEY)]
                const firstAppKeyPrefix = getAppKeyPrefix(firstAppName)
                const firstAppExpectedKeys = firstAppKeys.map(key => getAppPrefixedKey(key, firstAppKeyPrefix))

                const secondAppKeyPrefix = getAppKeyPrefix(secondAppName)
                const secondAppExpectedKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES)]

                await fillKVDB({
                    connectionString: firstAppConnection,
                    keys: firstAppKeys,
                })
                await fillKVDB({
                    connectionString: secondAppConnection,
                    keys: secondAppExpectedKeys,
                })

                repo = createTestMonoRepo()
                    .createApp({
                        name: firstAppName,
                        env: { REDIS_URL: firstAppConnection },
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })
                    .createApp({
                        name: secondAppName,
                        env: { REDIS_URL: secondAppConnection },
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })

                const result = await runMigrator([command, '-y'], { cwd: path.dirname(repo.apps[0].location) })
                expectSuccessfulExecution(result)

                const firstAppTransformedKeys = await getAllKeys({ connectionString: firstAppConnection })
                const secondAppTransformedKeys = await getAllKeys({ connectionString: secondAppConnection })

                expect(firstAppTransformedKeys.size).toEqual(firstAppExpectedKeys.length)
                expect(secondAppTransformedKeys.size).toEqual(secondAppExpectedKeys.length)

                const missingFirstAppKeys = firstAppExpectedKeys.filter(key => !firstAppTransformedKeys.has(key))
                expect(missingFirstAppKeys).toHaveLength(0)

                const missingSecondAppKeys = secondAppExpectedKeys.filter(key => !secondAppTransformedKeys.has(key))
                expect(missingSecondAppKeys).toHaveLength(0)

                const firstClient = new IORedis(firstAppConnection)
                const firstAppDV = await firstClient.get(getAppPrefixedKey(DV_KEY, firstAppKeyPrefix))
                expect(firstAppDV).toEqual('2')
                await firstClient.quit()

                const secondClient = new IORedis(secondAppConnection)
                const secondAppDV = await secondClient.get(getAppPrefixedKey(DV_KEY, secondAppKeyPrefix))
                expect(secondAppDV).toEqual(null)
                await secondClient.quit()
            }, TEST_TIMEOUT_IN_MS)
            test('Must migrate single app when passing .env directly', async () => {
                const firstAppName = '@app/first-app'
                const secondAppName = '@app/second-app'

                const firstAppConnection = getRedisVirtualDBConnection(host, port)

                const firstAppKeys = [...generateAppKeys(DB_SIZE, BULL_QUEUES).add(DV_KEY)]
                const firstAppKeyPrefix = getAppKeyPrefix(firstAppName)
                const firstAppExpectedKeys = firstAppKeys.map(key => getAppPrefixedKey(key, firstAppKeyPrefix))

                await fillKVDB({
                    connectionString: firstAppConnection,
                    keys: firstAppKeys,
                })

                repo = createTestMonoRepo()
                    .createApp({
                        name: firstAppName,
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })
                    .createApp({
                        name: secondAppName,
                        dependencies: { '@open-condo/keystone': 'workspace:^' },
                    })

                const failedResult = await runMigrator([command, '-y'], {
                    cwd: repo.rootDir.name,
                    env: { REDIS_URL: firstAppConnection },
                    reject: false,
                })

                expect(failedResult.exitCode).not.toEqual(0)
                expect(failedResult.stderr).toContain('Unable to migrate because multiple applications in the list share a common base')
                expect(failedResult.stderr).toContain(`- ["${firstAppName}", "${secondAppName}"]`)

                const successfulResult = await runMigrator([command, '-f', firstAppName, '-y'], {
                    cwd: repo.rootDir.name,
                    env: { REDIS_URL: firstAppConnection },
                })

                expectSuccessfulExecution(successfulResult)

                const firstAppTransformedKeys = await getAllKeys({ connectionString: firstAppConnection })
                expect(firstAppTransformedKeys.size).toEqual(firstAppExpectedKeys.length)

                const missingFirstAppKeys = firstAppExpectedKeys.filter(key => !firstAppTransformedKeys.has(key))
                expect(missingFirstAppKeys).toHaveLength(0)

                const firstClient = new IORedis(firstAppConnection)
                const firstAppDV = await firstClient.get(getAppPrefixedKey(DV_KEY, firstAppKeyPrefix))
                expect(firstAppDV).toEqual('2')
                await firstClient.quit()
            }, TEST_TIMEOUT_IN_MS)
        })
    })
})