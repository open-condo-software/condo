import { faker } from '@faker-js/faker'

import type { Monorepo } from '@/utils/tests/repo'

import { extractEnvValue } from '@/utils/envs'
import { createTestMonoRepo } from '@/utils/tests/repo'


describe('Environment utils', () => {
    let repo: Monorepo | undefined
    const testKey = 'REDIS_URL'
    const originalEnv = { ...process.env }
    afterEach(() => {
        repo?.destroy()
        process.env = { ...originalEnv }
    })
    describe('extractEnvValue', () => {
        test('Must correctly extract value from app\'s .env file', async () => {
            const expectedValue1 = faker.random.alphaNumeric(10)
            const expectedValue2 = faker.random.alphaNumeric(12)

            repo = createTestMonoRepo()
                .createApp({
                    env: {
                        [testKey]: expectedValue1,
                    },
                })
                .createApp({
                    env: {
                        [testKey]: expectedValue2,
                    },
                })

            const value1 = await extractEnvValue(repo.apps[0], testKey)
            const value2 = await extractEnvValue(repo.apps[1], testKey)
            expect(value1).toEqual(expectedValue1)
            expect(value2).toEqual(expectedValue2)
        })
        test('Must pickup env value from global .env (from CI / export etc.)', async () => {
            const expectedValue = faker.random.alphaNumeric(10)
            process.env[testKey] = expectedValue

            repo = createTestMonoRepo().createApp()

            const value = await extractEnvValue(repo.apps[0], testKey)
            expect(value).toEqual(expectedValue)
        })
        test('Must prioritize value from .env over global one', async () => {
            const globalValue = faker.random.alphaNumeric(12)
            const envValue = faker.random.alphaNumeric(12)

            process.env[testKey] = globalValue
            repo = createTestMonoRepo().createApp({
                env: { [testKey]: envValue },
            })

            const value = await extractEnvValue(repo.apps[0], testKey)
            expect(value).toEqual(envValue)
        })
        test('Must return undefined if variable not set', async () => {
            repo = createTestMonoRepo().createApp({
                env: { ['VALKEY_URL']: faker.random.alphaNumeric(10) },
            })

            const value = await extractEnvValue(repo.apps[0], testKey)
            expect(value).toEqual(undefined)
        })
    })
})