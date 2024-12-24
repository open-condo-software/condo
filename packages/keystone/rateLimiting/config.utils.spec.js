const { faker } = require('@faker-js/faker')

const { validatePluginOptions } = require('./config.utils')

function randomInt (maxInt = 100_000) {
    return Math.floor(Math.random() * maxInt)
}

describe('Plugin config utils', () => {
    describe('validatePluginOptions', () => {
        describe('Must bypass valid options', () => {
            const validCases = [
                ['empty config', {}],
                ['tests config', {
                    customQuotas: {
                        '::1': randomInt(100_000_000),
                        '127.0.0.1': randomInt(100_000_000),
                    },
                }],
                ['real-word config', {
                    customQuotas: {
                        [faker.datatype.uuid()]: randomInt(),
                        [faker.internet.ipv4()]: randomInt(),
                        [faker.datatype.uuid()]: randomInt(),
                        [faker.internet.ipv4()]: randomInt(),
                    },
                }],
                ['custom window #1', { window: '5 hours' }],
                ['custom window #2', { window: '40 min' }],
                ['full config', {
                    customQuotas: {
                        [faker.datatype.uuid()]: randomInt(),
                        [faker.internet.ipv4()]: randomInt(),
                    },
                    queryWeight: randomInt(10),
                    mutationWeight: randomInt(100),
                    window: `${randomInt(2) + 1} hours`,
                    authedQuota: randomInt(100_000),
                    nonAuthedQuota: randomInt(100_000),
                    whereScalingFactor: Math.random() * 3,
                    pageLimit: randomInt(1000),
                }],
            ]

            test.each(validCases)('%p', (_, options) => {
                expect(() => validatePluginOptions(options)).not.toThrow()
                const validated = validatePluginOptions(options)
                expect(validated).toEqual(options)
            })
        })
        describe('Must throw error on invalid options', () => {
            const invalidCases = [
                ['identifiersWhiteList list is not array', { identifiersWhiteList: faker.datatype.uuid() }],
                ['customQuotas is not record', { customQuotas: [{ ip: faker.internet.ipv4(), quota: randomInt() }] }],
                ['customQuotas values is not numbers', { customQuotas: { [faker.datatype.uuid()]: String(randomInt()) } }],
                ['window is number', { window: 3_600_000 }],
                ['queryWeight is not number', { queryWeight: '100' }],
                ['mutationWeight is not number', { mutationWeight: '100' }],
                ['authedQuota is not number', { authedQuota: '100_000' }],
                ['nonAuthedQuota is not number', { nonAuthedQuota: '100' }],
                ['whereScalingFactor is not number', { whereScalingFactor: '2' }],
                ['pageLimit is not number', { pageLimit: '200' }],
            ]

            test.each(invalidCases)('%p', (_, options) => {
                expect(() => validatePluginOptions(options)).toThrow(/Invalid ApolloRateLimitingPlugin options provided/)
            })
        })
    })
})