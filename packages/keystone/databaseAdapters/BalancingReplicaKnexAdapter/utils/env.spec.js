const { faker } = require('@faker-js/faker')

const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { getNamedDBs } = require('./env')

function getValidConnectionString () {
    return `postgresql://${faker.internet.userName()}:${faker.internet.password()}@${faker.internet.domainName()}:${faker.internet.port()}/${faker.random.word()}`
}

function generateUrl (obj) {
    return `custom:${JSON.stringify(obj)}`
}

function generateMapping (length) {
    return Object.fromEntries(Array.from({ length }, (_, i) => [
        faker.random.word(),
        getValidConnectionString(),
    ]))
}

describe('Config validation utils', () => {
    describe('getNamedDBs', () => {
        describe('Must throw error on invalid database url', () => {
            const cases = [
                undefined,
                'some-string',
                getValidConnectionString(),
            ]
            test.each(cases)('%p', (databaseUrl) => {
                expect(() => getNamedDBs(databaseUrl)).toThrow(/Invalid DB url/)
            })
        })
        test('Must throw error on empty configuration', () => {
            expect(() => getNamedDBs('custom:{ }')).toThrow('Invalid DB config inside databaseUrl. data must NOT have fewer than 1 properties')
        })
        describe('Must throw error on non-connection string inputs', () => {
            const cases = [
                { main: getValidConnectionString(), other: 'non-valid' },
                { main: getValidConnectionString(), other: 2 },
                { main: [getValidConnectionString(), getValidConnectionString()] },
            ].map(testCase => generateUrl(testCase))
            test.each(cases)('%p', (databaseUrl) => {
                expect(() => getNamedDBs(databaseUrl)).toThrow(/Invalid DB config inside databaseUrl/)
            })
        })
        describe('Must return mapping on correct config', () => {
            const cases = [
                ['Single DB case', { main: getValidConnectionString() }],
                ['Multiple DB case', { main: getValidConnectionString(), replica: getValidConnectionString() }],
                ['Small gen case', generateMapping(5)],
                ['Big gen case', generateMapping(50)],
            ]
            test.each(cases)('%p', (_, mapping) => {
                const input = generateUrl(mapping)
                expect(getNamedDBs(input)).toEqual(mapping)
            })
        })
    })
})