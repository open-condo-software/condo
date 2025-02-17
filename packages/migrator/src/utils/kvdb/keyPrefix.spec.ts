import { faker } from '@faker-js/faker'

import { getAppKeyPrefix, getAppPrefixedKey } from './keyPrefix'

const TEST_QUEUE_NAMES = ['low', 'high', 'tasks', 'queue']
const STRESS_TEST_EXAMPLES = 5_000

function randInt (min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}

function generateRandomKey (parts: number): string {
    return Array.from({ length: parts }, () => faker.random.alphaNumeric(randInt(3, 9))).join(':')
}

function getRandomQueueName (): string {
    return TEST_QUEUE_NAMES[randInt(0, TEST_QUEUE_NAMES.length)]
}

describe('Key prefixing utils', () => {
    describe('getAppKeyPrefix', () => {
        test('Must omit scope', () => {
            expect(getAppKeyPrefix('@app/condo')).toEqual('condo')
            expect(getAppKeyPrefix('@other-long-scope/condo')).toEqual('condo')
        })
        test('Must replace "-" with "_"', () => {
            expect(getAppKeyPrefix('@app/multiple-words-app')).toEqual('multiple_words_app')
            expect(getAppKeyPrefix('multiple-words-app')).toEqual('multiple_words_app')
        })
        test('Must cast result to lower case', () => {
            expect(getAppKeyPrefix('@app/Multiple-WORDS-app')).toEqual('multiple_words_app')
            expect(getAppKeyPrefix('@aPP/CoNdO')).toEqual('condo')
        })
        describe('Real scenarios test', () => {
            const cases = [
                ['@open-condo/keystone', 'keystone'],
                ['@app/address-service', 'address_service'],
                ['@app/condo', 'condo'],
                ['@app/dev-portal-api', 'dev_portal_api'],
                ['@app/employee-bot', 'employee_bot'],
                ['@app/eps', 'eps'],
                ['@app/external-api', 'external_api'],
                ['@app/insurance', 'insurance'],
                ['@app/meter-importer', 'meter_importer'],
                ['@app/miniapp', 'miniapp'],
                ['@app/news-greenhouse', 'news_greenhouse'],
                ['@app/pass', 'pass'],
                ['@app/property-importer', 'property_importer'],
                ['@app/rb', 'rb'],
                ['@app/registry-importer', 'registry_importer'],
                ['@app/telephony', 'telephony'],
                ['@app/ticket-importer', 'ticket_importer'],
            ]
            test.each(cases)('%p', (appName, expectedPrefix) => {
                expect(getAppKeyPrefix(appName)).toEqual(expectedPrefix)
            })
        })
    })
    describe('getAppPrefixedKey', () => {
        describe('Must generate valid keys', () => {
            const keyPrefixes = Array.from({ length: 3 }, (_, idx) =>
                Array.from({ length: idx + 1 }, () => faker.random.alphaNumeric(randInt(5, 8))).join('_')
            )
            describe.each(keyPrefixes)('%p keyPrefix', (keyPrefix) => {
                describe('Must not change', () => {
                    test('Empty key', () => {
                        expect(getAppPrefixedKey('', keyPrefix)).toEqual('')
                    })
                    describe('Already prefixed key', () => {
                        describe('Bull keys', () => {
                            test('Bull queue key', () => {
                                const keys = TEST_QUEUE_NAMES
                                    .map(queueName => `{${keyPrefix}:bull:${queueName}}`)
                                const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                                expect(results).toEqual(keys)
                            })
                            test('Bull queue sub-key', () => {
                                const keys = Array.from(
                                    { length: STRESS_TEST_EXAMPLES },
                                    () => `{${keyPrefix}:bull:${getRandomQueueName()}}:${generateRandomKey(randInt(1, 4))}`
                                )
                                const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                                expect(results).toEqual(keys)
                            })
                        })
                        describe('Other keys', () => {
                            const keys = Array.from(
                                { length: STRESS_TEST_EXAMPLES },
                                () => `${keyPrefix}:${generateRandomKey(randInt(1, 7))}`
                            )
                            const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                            expect(results).toEqual(keys)
                        })
                    })
                })
                describe('Must add keyPrefix for non-bull keys', () => {
                    const keys = Array.from(
                        { length: STRESS_TEST_EXAMPLES },
                        () => generateRandomKey(randInt(1, 7))
                    )
                    const expectedKeys = keys.map(key => `${keyPrefix}:${key}`)
                    const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                    expect(results).toEqual(expectedKeys)
                })
                describe('Must add keyPrefix and wrap queue in {} for bull-keys', () => {
                    test('Empty suffix', () => {
                        const keys = TEST_QUEUE_NAMES.map(queueName => `bull:${queueName}`)
                        const expectedKeys = TEST_QUEUE_NAMES.map(queueName => `{${keyPrefix}:bull:${queueName}}`)

                        const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                        expect(results).toEqual(expectedKeys)
                    })
                    test('Non-empty suffix', () => {
                        const keys = Array.from(
                            { length: STRESS_TEST_EXAMPLES },
                            () => `bull:${getRandomQueueName()}:${generateRandomKey(randInt(1, 3))}`
                        )
                        const expectedKeys = keys.map(key => {
                            const [_, queueName, ...suffix] = key.split(':')

                            return `{${keyPrefix}:bull:${queueName}}:${suffix.join(':')}`
                        })

                        const results = keys.map((key) => getAppPrefixedKey(key, keyPrefix))
                        expect(results).toEqual(expectedKeys)
                    })
                })
            })
        })
    })
})