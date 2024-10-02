const { faker } = require('@faker-js/faker')

const { getNamedDBs, getReplicaPoolsConfig } = require('./env')

function generateValidConnectionString () {
    return `postgresql://${faker.internet.userName()}:${faker.internet.password()}@${faker.internet.domainName()}:${faker.internet.port()}/${faker.random.word()}`
}

function generateUrl (obj) {
    return `custom:${JSON.stringify(obj)}`
}

function generateMapping (length) {
    return Object.fromEntries(Array.from({ length }, (_, i) => [
        faker.random.word(),
        generateValidConnectionString(),
    ]))
}

describe('Config validation utils', () => {
    describe('getNamedDBs', () => {
        describe('Must throw error on incorrect input type', () => {
            const cases = [
                undefined,
                'some-string',
                generateValidConnectionString(),
            ]
            test.each(cases)('%p', (databaseUrl) => {
                expect(() => getNamedDBs(databaseUrl)).toThrow(/Invalid DB url/)
            })
        })
        test('Must throw error on empty configuration', () => {
            expect(() => getNamedDBs('custom:{ }'))
                .toThrow('Invalid DB config inside databaseUrl. data must NOT have fewer than 1 properties')
        })
        test('Must throw on empty name', () => {
            const config = generateUrl({ '': generateValidConnectionString() })
            expect(() => getNamedDBs(config))
                .toThrow('Invalid DB config inside databaseUrl. data must NOT have additional properties')
        })
        describe('Must throw error on non-connection string inputs', () => {
            const cases = [
                { main: generateValidConnectionString(), other: 'non-valid' },
                { main: generateValidConnectionString(), other: 2 },
                { main: [generateValidConnectionString(), generateValidConnectionString()] },
            ].map(testCase => generateUrl(testCase))
            test.each(cases)('%p', (databaseUrl) => {
                expect(() => getNamedDBs(databaseUrl))
                    .toThrow(/Invalid DB config inside databaseUrl/)
            })
        })
        describe('Must return mapping on correct config', () => {
            const cases = [
                ['Single DB case', { main: generateValidConnectionString() }],
                ['Multiple DB case', { main: generateValidConnectionString(), replica: generateValidConnectionString() }],
                ['Small gen case', generateMapping(5)],
                ['Big gen case', generateMapping(50)],
            ]
            test.each(cases)('%p', (_, mapping) => {
                const input = generateUrl(mapping)
                expect(getNamedDBs(input)).toEqual(mapping)
            })
        })
    })
    describe('getReplicaPoolsConfig', () => {
        const basicConfig = {
            master: { databases: ['master'], writable: true },
            asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
        }
        describe('Must throw error on incorrect input type', () => {
            const cases = [
                undefined,
                123,
                basicConfig, // Raw string expected
            ]
            test.each(cases)('%p', (input) => {
                expect(() => getReplicaPoolsConfig(input, ['master']))
                    .toThrow(/Invalid DB pools config passed\. String was expected/)
            })
        })
        test('Must throw error on empty configuration', () => {
            expect(() => getReplicaPoolsConfig('{}', ['master']))
                .toThrow('Invalid DB pools config. data must NOT have fewer than 1 properties')
        })
        describe('Must throw on invalid pool config', () => {
            const cases = [
                ['non object #1', 'pool'],
                ['non object #2', 123],
                ['empty object', {}],
                ['databases missing', { writeable: true }],
                ['writeable missing', { databases: ['master'] }],
                ['non-boolean writeable', { databases: ['master'], writeable: 'true' }],
                ['empty databases', { databases: [], writeable: true }],
                ['non-existing database', { databases: ['db'], writeable: true }],
                ['partial non-existing database', { databases: ['master', 'db'], writeable: true }],
            ]
            test.each(cases)('%p', (_, pool) => {
                const configString = JSON.stringify({ pool })
                expect(() => getReplicaPoolsConfig(configString, ['master']))
                    .toThrow('Invalid DB pools config.')
            })
        })
        test('Must throw if all pools are non-writable', () => {
            const configString = JSON.stringify({
                asyncReplicas: { databases: ['asyncReplica'], writable: false },
                syncReplicas: { databases: ['syncReplica'], writable: false },
                asyncBillingReplicas: { databases: ['asyncBillingReplica'], writable: false },
            })
            expect(() => getReplicaPoolsConfig(
                configString,
                ['asyncReplica', 'syncReplica', 'asyncBillingReplica']
            ))
                .toThrow('Invalid DB pools config. Expected at least 1 pool to be writable')
        })
        describe('Must parse correct config', () => {
            const cases = [
                [
                    'simple',
                    { main: { databases: ['main'], writable: true } },
                    ['main'],
                ],
                [
                    'with single replica',
                    {
                        main: { databases: ['main'], writable: true },
                        replica: { databases: ['replica'], writable: false },
                    },
                    ['main', 'replica'],
                ],
                [
                    'with multiple replicas',
                    {
                        main: { databases: ['main'], writable: true },
                        replica: { databases: ['firstReplica', 'secondReplica'], writable: false },
                    },
                    ['main', 'firstReplica', 'secondReplica'],
                ],
                [
                    'with multiple replicas pools',
                    {
                        main: { databases: ['main'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                    },
                    ['main', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2'],
                ],
                [
                    'with multiple writeable DBs',
                    {
                        write: { databases: ['master1', 'master2'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                    },
                    ['master1', 'master2', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2'],
                ],
                [
                    'with multiple db clusters',
                    {
                        write: { databases: ['master'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                        billing: { databases: ['billing'], writable: true },
                    },
                    ['master', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2', 'billing'],
                ],
                [
                    'with multiple db clusters with replicas',
                    {
                        write: { databases: ['master'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                        billingWrite: { databases: ['billingWrite'], writable: true },
                        asyncBillingReplicas: { databases: ['asyncBillingReplica'], writable: false },
                    },
                    ['master', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2', 'billingWrite', 'asyncBillingReplica'],
                ],
                [
                    'with intersecting databases',
                    {
                        write: { databases: ['master'], writable: true },
                        somePool: { databases: ['replica', 'master'], writable: false },
                        anotherPool: { databases: ['replica', 'anotherReplica'], writable: false },
                    },
                    ['master', 'replica', 'anotherReplica'],
                ],
            ]

            test.each(cases)('%p', (_, config, allDatabases) => {
                const configString = JSON.stringify(config)
                expect(getReplicaPoolsConfig(configString, allDatabases)).toEqual(config)
            })
        })
    })
})