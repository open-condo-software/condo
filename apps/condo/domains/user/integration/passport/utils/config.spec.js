const { faker } = require('@faker-js/faker')

const { passportConfigSchema } = require('./config')

const validConfigs = {
    github: {
        clientID: faker.random.alphaNumeric(12),
        clientSecret: faker.random.alphaNumeric(32),
    },
    oidc: {
        issuer: faker.internet.url(),
        authorizationURL: faker.internet.url(),
        tokenURL: faker.internet.url(),
        userInfoURL: faker.internet.url(),
        clientID: faker.random.alphaNumeric(12),
        clientSecret: faker.random.alphaNumeric(32),
    },
    oidcTokenUserInfo: {
        clients: {
            [faker.random.alphaNumeric(12)]: {
                identityType: faker.random.alphaNumeric(12),
                userInfoURL: faker.internet.url(),
            },
        },
    },
}

const generators = {
    string: () => faker.random.alphaNumeric(16),
    number: () => Math.floor(Math.random() * 1000),
    url: () => faker.internet.url(),
    null: () => null,
    undefined: () => undefined,
}

function getValueType (key, value) {
    if (typeof value === 'string' && key.toLowerCase().endsWith('url')) return 'url'

    return typeof value
}

function getInvalidDataTypes (originalDataType) {
    const otherTypes = Object.keys(generators).filter(key => key !== originalDataType)
    if (originalDataType !== 'string') return otherTypes

    return otherTypes.filter(otherType => originalDataType !== typeof generators[otherType]())
}

function _generateCombinations (options) {
    const keys = Object.keys(options)
    const total = Object.values(options).map(variants => variants.length).reduce((acc, cur) => acc * cur, 1)

    const combinations = []

    for (let i = 0; i < total; i++) {
        let left = i
        let spaceSize = total
        const combination = {}

        for (const key of keys) {
            const optionSize = spaceSize / options[key].length
            const option = Math.floor(left / optionSize)
            combination[key] = options[key][option]
            spaceSize = optionSize
            left -= option * optionSize
        }

        combinations.push(combination)
    }

    return combinations
}

function _omitUndefined (obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => typeof value !== 'undefined'))
}

function generateValidOIDCTokenOptions () {
    const result = []
    for (const combination of _generateCombinations({
        id: ['sub', undefined],
        phone: ['phone_number', undefined],
        isPhoneVerified: ['phone_number_verified', undefined],
        email: ['email', 'user_email', undefined],
        isEmailVerified: ['email_verified', undefined],
        trustPhone: [true, false, undefined],
        trustEmail: [true, false, undefined],
    })) {
        const filtered = _omitUndefined(combination)
        const { trustEmail, trustPhone, ...fieldMapping } = filtered
        const clientOptions = _omitUndefined({
            trustEmail,
            trustPhone,
            userInfoURL: faker.internet.url(),
            fieldMapping,
            identityType: faker.random.alphaNumeric(12),
        })

        const testKey = Object.entries(combination).map(([k, v]) => `${k}:${v}`).join(' ')

        result.push([testKey, {
            clients: {
                [faker.random.alphaNumeric(12)]: clientOptions,
            },
        }])
    }

    return result
}

function generateInvalidOIDCTokenOptions () {
    return [
        ['no identityType', { clients: { [faker.random.alphaNumeric(12)]: {  userInfoURL: faker.internet.url(), fieldMapping: { unknownField: 'id' } } } }],
        ['unknown mapping', { clients: { [faker.random.alphaNumeric(12)]: {  identityType: faker.random.alphaNumeric(12), userInfoURL: faker.internet.url(), fieldMapping: { unknownField: 'id' } } } }],
        ['invalid mapping', { clients: { [faker.random.alphaNumeric(12)]: {  identityType: faker.random.alphaNumeric(12), userInfoURL: faker.internet.url(), fieldMapping: { sub: 2 } } } }],
        ['invalid trustEmail', { clients: { [faker.random.alphaNumeric(12)]: {  identityType: faker.random.alphaNumeric(12), userInfoURL: faker.internet.url(), trustEmail: 1 } } }],
        ['invalid trustPhone', { clients: { [faker.random.alphaNumeric(12)]: {  identityType: faker.random.alphaNumeric(12), userInfoURL: faker.internet.url(), trustPhone: 1 } } }],
    ]
}

const examplesGenerator = {
    oidcTokenUserInfo: { valid: generateValidOIDCTokenOptions, invalid: generateInvalidOIDCTokenOptions },
}

describe('passport config utils', () => {
    describe('validatePassportConfig', () => {
        describe('must accept valid configurations', () => {
            describe('basic config', () => {
                describe.each(Object.entries(validConfigs))('%p', (strategy, options) => {
                    test('must pass valid config', () => {
                        expect(passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: { ...options },
                        }]).success).toEqual(true)
                    })
                    test('must fill defaults for trustEmail / trustPhone', () => {
                        const { success, data } = passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: { ...options },
                        }])
                        expect(success).toEqual(true)
                        expect(data).toHaveLength(1)
                        expect(data[0]).toHaveProperty('trustEmail')
                        expect(data[0]).toHaveProperty('trustPhone')
                    })
                    test('must prioritize passed value for trustEmail / trustPhone', () => {
                        const { success, data } = passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: { ...options },
                        }])
                        expect(success).toEqual(true)
                        expect(data).toHaveLength(1)
                        expect(data[0]).toHaveProperty('trustEmail')
                        expect(data[0]).toHaveProperty('trustPhone')

                        const { success: newSuccess, data: newData } = passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: { ...options },
                            trustEmail: !data[0].trustEmail,
                            trustPhone: !data[0].trustPhone,
                        }])

                        expect(newSuccess).toEqual(true)
                        expect(newData).toHaveLength(1)
                        expect(newData[0]).toHaveProperty('trustEmail', !data[0].trustEmail)
                        expect(newData[0]).toHaveProperty('trustPhone', !data[0].trustPhone)
                    })
                })
            })
            describe('complex config', () => {
                describe.each(Object.keys(examplesGenerator).filter(strategy => examplesGenerator[strategy].valid))('%p', (strategy) => {
                    test.each(examplesGenerator[strategy].valid())('%p', (_, strategyOptions) => {
                        expect(passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: strategyOptions,
                        }]).success).toEqual(true)
                    })
                })
            })
        })
        describe('must not accept invalid configurations', () => {
            describe('basic config', () => {
                describe.each(Object.entries(validConfigs))('%p', (strategy, options) => {
                    test('unknown properties', () => {
                        expect(passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: {
                                ...options,
                                [faker.random.alphaNumeric(12)]: faker.random.alphaNumeric(12),
                            },
                        }]).success).toEqual(false)
                    })
                    describe('missing fields', () => {
                        test.each(Object.keys(options))('%p field missing', (optionName) => {
                            expect(passportConfigSchema.safeParse([{
                                name: faker.random.alphaNumeric(12),
                                strategy,
                                options: Object.fromEntries(Object.entries(options).filter(([key]) => key !== optionName)),
                            }]).success).toEqual(false)
                        })
                    })
                    describe('invalid fields', () => {
                        describe.each(Object.keys(options))('%p', (optionName) => {
                            test.each(getInvalidDataTypes(getValueType(optionName, options[optionName])))('is %p', (dataType) => {
                                expect(passportConfigSchema.safeParse([{
                                    name: faker.random.alphaNumeric(12),
                                    strategy,
                                    options: {
                                        ...options,
                                        [optionName]: generators[dataType](),
                                    },
                                }]).success).toEqual(false)
                            })
                        })
                    })
                })
            })
            describe('complex config', () => {
                describe.each(Object.keys(examplesGenerator).filter(strategy => examplesGenerator[strategy].invalid))('%p', (strategy) => {
                    test.each(examplesGenerator[strategy].invalid())('%p', (_, strategyOptions) => {
                        expect(passportConfigSchema.safeParse([{
                            name: faker.random.alphaNumeric(12),
                            strategy,
                            options: strategyOptions,
                        }]).success).toEqual(false)
                    })
                })
            })
        })
    })
})