const { faker } = require('@faker-js/faker')

const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules } = require('./env')

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
        describe('Must throw error on incorrect input type', () => {
            const cases = [
                undefined,
                123,
            ]
            test.each(cases)('%p', (input) => {
                expect(() => getReplicaPoolsConfig(input, ['master']))
                    .toThrow(/Invalid DB pools config passed\. Object or its stringified representation was expected/)
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
                ['databases missing', { writable: true, balancer: 'RoundRobin' }],
                ['writable missing', { databases: ['master'], balancer: 'RoundRobin' }],
                ['invalid balancer', { databases: ['master'], writable: true, balancer: 'SquaredJack' }],
                ['non-boolean writable', { databases: ['master'], writable: 'true', balancer: 'RoundRobin' }],
                ['empty databases', { databases: [], writable: true }],
                ['non-existing database', { databases: ['db'], writable: true }],
                ['partial non-existing database', { databases: ['master', 'db'], writable: true }],
            ]
            test.each(cases)('%p', (_, pool) => {
                const configString = JSON.stringify({ pool })
                expect(() => getReplicaPoolsConfig(configString, ['master']))
                    .toThrow('Invalid DB pools config')
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
                    'simple with implicit balancer',
                    { main: { databases: ['main'], writable: true } },
                    ['main'],
                ],
                [
                    'simple with explicit balancer',
                    { main: { databases: ['main'], writable: true, balancer: 'RoundRobin' } },
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
                    'with multiple writable DBs',
                    {
                        write: { databases: ['master1', 'master2'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                    },
                    ['master1', 'master2', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2'],
                ],
                [
                    'with multiple writable pools',
                    {
                        write: { databases: ['master'], writable: true },
                        asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                        syncReplicas: { databases: ['syncReplica1', 'syncReplica2'], writable: false },
                        billing: { databases: ['billing'], writable: true },
                    },
                    ['master', 'asyncReplica1', 'asyncReplica2', 'syncReplica1', 'syncReplica2', 'billing'],
                ],
                [
                    'with multiple DB clusters with own replicas',
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

            describe('passed as objects', () => {
                test.each(cases)('%p', (_, config, allDatabases) => {
                    const expectedConfig = Object.fromEntries(
                        Object.entries(config).map(([name, pool]) => [
                            name,
                            pool.balancer ? pool : { ...pool, balancer: 'RoundRobin' },
                        ])
                    )
                    expect(getReplicaPoolsConfig(config, allDatabases)).toEqual(expectedConfig)
                })
            })
            describe('passed as stringified (from env)', () => {
                test.each(cases)('%p', (_, config, allDatabases) => {
                    const expectedConfig = Object.fromEntries(
                        Object.entries(config).map(([name, pool]) => [
                            name,
                            pool.balancer ? pool : { ...pool, balancer: 'RoundRobin' },
                        ])
                    )
                    expect(getReplicaPoolsConfig(JSON.stringify(config), allDatabases)).toEqual(expectedConfig)
                })
            })


        })
        test('Must add RoundRobin as default balancer if not specified', () => {
            const simpleConfig = { main: { databases: ['main'], writable: true } }
            const result = getReplicaPoolsConfig(JSON.stringify(simpleConfig), ['main'])

            expect(result).toEqual({
                main: { ...simpleConfig.main, balancer: 'RoundRobin' },
            })
        })
    })
    describe('getQueryRoutingRules', () => {
        const availableDatabases = ['main', 'asyncReplica1']
        const basicPoolConfig = getReplicaPoolsConfig({
            main: { databases: ['main'], writable: true },
            replicas: { databases: ['asyncReplica1'], writable: false },
        }, availableDatabases)

        describe('Must throw error on incorrect input type', () => {
            const cases = [
                undefined,
                123,
                basicPoolConfig,
            ]
            test.each(cases)('%p', (input) => {
                expect(() => getQueryRoutingRules(input, basicPoolConfig))
                    .toThrow(/Invalid routing rules provided\. Expect array of rules or its string representation/)
            })
        })
        test('Must throw if no rules present', () => {
            expect(() => getQueryRoutingRules([], basicPoolConfig))
                .toThrow('Invalid routing rules config. data must NOT have fewer than 1 items')
        })
        describe('Must throw on invalid rule shape', () => {
            const cases = [
                ['target pool not exists', [{ target: 'flatEarth' }]],
                ['gqlOperationType is not string', [{ target: 'main', gqlOperationType: 123 }]],
                ['gqlOperationType is not mutation / query', [{ target: 'main', gqlOperationType: 'tripleFlip' }]],
                ['gqlOperationName is not string', [{ target: 'main', gqlOperationName: ['createUser', 'createUsers'] }]],
                ['sqlOperationName is not string', [{ target: 'main', sqlOperationName: ['select', 'show'] }]],
                ['sqlOperationName is not CRUD #1', [{ target: 'main', sqlOperationName: 'drop' }]],
                ['sqlOperationName is not CRUD #2', [{ target: 'main', sqlOperationName: 'create' }]],
                ['sqlOperationName is not CRUD #3', [{ target: 'main', sqlOperationName: 'alter' }]],
                ['tableName is not string', [{ target: 'main', tableName: ['User', 'Contact'] }]],
                ['unknown properties present', [{ target: 'main', listOperations: true }]],
            ]

            test.each(cases)('%p', (_, routingConfig) => {
                expect(() => getQueryRoutingRules(routingConfig, basicPoolConfig))
                    .toThrow(/Invalid routing rules config/)
            })
        })
        describe('Rules static analysis', () => {
            describe('Must protect GQL mutations from going to readonly pool', () => {
                const invalidCases = [
                    [
                        'mutation with no extra filters and readonly target',
                        [{ gqlOperationType: 'mutation', target: 'replicas' }, { target: 'main' }],
                    ],
                    [
                        'mutation with mutable sqlOperationName and readonly target',
                        [
                            { gqlOperationType: 'mutation', sqlOperationName: 'insert', target: 'replicas' },
                            { target: 'main' },
                        ],
                    ],
                ]
                const validCases = [
                    [
                        'query with no extra filters and readonly target',
                        [{ gqlOperationType: 'query', target: 'replicas' }, { target: 'main' }],
                    ],
                    [
                        'mutation with immutable sqlOperationName and readonly target',
                        [
                            { gqlOperationType: 'mutation', sqlOperationName: 'select', target: 'replicas' },
                            { target: 'main' },
                        ],
                    ],
                    [
                        'unnamed mutation with tableName and readonly target',
                        [
                            { gqlOperationType: 'mutation', tableName: 'User', target: 'replicas' },
                            { target: 'main' },
                        ],
                    ],
                    [
                        'named mutation with tableName and readonly target',
                        [
                            { gqlOperationType: 'mutation', gqlOperationName: 'allContacts', tableName: 'User', target: 'replicas' },
                            { target: 'main' },
                        ],
                    ],
                    [
                        'named gqlOperation without type',
                        [{ gqlOperationName: 'queryOrMutationName', target: 'replicas' }, { target: 'main' }],
                    ],
                ]
                test.each(invalidCases)('Must throw on %p', (_, input) => {
                    expect(() => getQueryRoutingRules(input, basicPoolConfig))
                        .toThrow(/"gqlOperationType" is set to "mutation", while target pool is not writable/)
                })
                test.each(validCases)('Must correctly parse config for %p', (_, input) => {
                    expect(getQueryRoutingRules(input, basicPoolConfig)).toEqual(input)
                })
            })
            describe('Must protect mutable SQL operations from going to readonly pool', () => {
                const mutableOperations = ['insert', 'update', 'delete']
                // Select not really immutable in case of "select into", but this is not static analysis
                const immutableOperations = ['show', 'select']

                test.each(mutableOperations)('Must throw on %p sqlOperationName', (sqlOperationName) => {
                    const routingConfig = [
                        { target: 'replicas', sqlOperationName: sqlOperationName },
                        { target: 'main' },
                    ]

                    expect(() => getQueryRoutingRules(routingConfig, basicPoolConfig))
                        .toThrow(`"sqlOperationName" is set to "${sqlOperationName}", while target pool is not writable`)
                })
                test.each(immutableOperations)('Must pass checks on %p sqlOperationName', (sqlOperationName) => {
                    const routingConfig = [
                        { target: 'replicas', sqlOperationName: sqlOperationName },
                        { target: 'main' },
                    ]

                    expect(getQueryRoutingRules(routingConfig, basicPoolConfig)).toEqual(routingConfig)
                })
            })
            describe('Must have default rule', () => {
                test('Default rule must point at writable pool', () => {
                    expect(() => getQueryRoutingRules([{ target: 'replicas' }], basicPoolConfig))
                        .toThrow(/Rule with no filters must point to writable target/)
                })
                describe('Default rule must be at the bottom of chain', () => {
                    test('Placement in the middle case', () => {
                        const input = [
                            { target: 'main' },
                            { target: 'main', gqlOperationType: 'mutation' },
                        ]
                        expect(() => getQueryRoutingRules(input, basicPoolConfig))
                            .toThrow(/Rule with no filters must be at the end of the rule chain/)
                    })
                    test('Middle case', () => {
                        const input = [
                            { target: 'replicas', gqlOperationType: 'query' },
                            { target: 'main', gqlOperationType: 'mutation' },
                        ]
                        expect(() => getQueryRoutingRules(input, basicPoolConfig))
                            .toThrow(/Latest rule in chain must contains no filters/)
                    })
                })
            })
        })
        describe('Must parse correct configs', () => {
            const availableDatabases = ['main', 'asyncReplica1', 'asyncReplica2', 'syncBillingReplica', 'hr']
            const pools = getReplicaPoolsConfig({
                main: { databases: ['main'], writable: true },
                asyncReplicas: { databases: ['asyncReplica1', 'asyncReplica2'], writable: false },
                billingReplica: { databases: ['syncBillingReplica'], writable: false },
                historical: { databases: ['hr'], writable: true },
            }, availableDatabases)
            const cases = [
                [
                    'single db',
                    [
                        { target: 'main' },
                    ],
                ],
                [
                    'with select from replicas',
                    [
                        { target: 'asyncReplicas', sqlOperationName: 'select' },
                        { target: 'asyncReplicas', sqlOperationName: 'show' },
                        { target: 'main' },
                    ],
                ],
                [
                    'with select from replicas and mutations',
                    [
                        { target: 'main', gqlOperationType: 'mutation' },
                        { target: 'asyncReplicas', sqlOperationName: 'select' },
                        { target: 'asyncReplicas', sqlOperationName: 'show' },
                        { target: 'main' },
                    ],
                ],
                [
                    'with separate replica for some data',
                    [
                        { target: 'billingReplica', sqlOperationName: 'select', tableName: '^Billing.+$' },
                        { target: 'main', gqlOperationType: 'mutation' },
                        { target: 'asyncReplicas', sqlOperationName: 'select' },
                        { target: 'asyncReplicas', sqlOperationName: 'show' },
                        { target: 'main' },
                    ],
                ],
                [
                    'with separate db for some data',
                    [
                        { target: 'historical', tableName: '^.+HistoryRecord$' },
                        { target: 'billingReplica', sqlOperationName: 'select', tableName: '^Billing.+$' },
                        { target: 'main', gqlOperationType: 'mutation' },
                        { target: 'asyncReplicas', sqlOperationName: 'select' },
                        { target: 'asyncReplicas', sqlOperationName: 'show' },
                        { target: 'main' },
                    ],
                ],
            ]
            describe('passed as objects', () => {
                test.each(cases)('%p', (_, config) => {
                    const expected = config.map(rule => rule.tableName
                        // NOTE: controlled tests environment
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        ? { ...rule, tableName: new RegExp(rule.tableName) }
                        : rule
                    )

                    expect(getQueryRoutingRules(config, pools)).toEqual(expected)
                })
            })
            describe('passed as stringified objects', () => {
                test.each(cases)('%p', (_, config) => {
                    const expected = config.map(rule => rule.tableName
                        // NOTE: controlled tests environment
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        ? { ...rule, tableName: new RegExp(rule.tableName) }
                        : rule
                    )

                    expect(getQueryRoutingRules(JSON.stringify(config), pools)).toEqual(expected)
                })
            })
        })
        describe('Must detect and replace RegExps', () => {
            describe('In "tableName" field', () => {
                const regexpCases = [
                    '^.+HistoryRecord$',
                    '^Billing.+$',
                    '(Billing|Acquiring).+',
                ]
                const stringCases = [
                    'User',
                    'B2BApp',
                    'pg_attribute',
                ]
                test.each(regexpCases)('%p', (pattern) => {
                    const basicRules = [
                        { target: 'replicas', tableName: pattern },
                        { target: 'main' },
                    ]
                    const expected = [
                        // NOTE: controlled tests environment
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        { target: 'replicas', tableName: new RegExp(pattern) },
                        { target: 'main' },
                    ]

                    expect(getQueryRoutingRules(basicRules, basicPoolConfig)).toEqual(expected)
                })
                test.each(stringCases)('%p', (pattern) => {
                    const basicRules = [
                        { target: 'replicas', tableName: pattern },
                        { target: 'main' },
                    ]

                    expect(getQueryRoutingRules(basicRules, basicPoolConfig)).toEqual(basicRules)
                })
            })
            describe('In "gqlOperationName" field', () => {
                const regexpCases = [
                    '^create.+$',
                    '^_internal.+$',
                    'register.*',
                    'create(User|Contact)',
                ]
                const stringCases = [
                    'registerNewServiceUser',
                    '_internalScheduleTaskByName',
                    'createB2BApp',
                    '_allB2BAppsMeta',
                ]
                test.each(regexpCases)('%p', (pattern) => {
                    const basicRules = [
                        { target: 'replicas', gqlOperationName: pattern },
                        { target: 'main' },
                    ]
                    const expected = [
                        // NOTE: controlled tests environment
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        { target: 'replicas', gqlOperationName: new RegExp(pattern) },
                        { target: 'main' },
                    ]

                    expect(getQueryRoutingRules(basicRules, basicPoolConfig)).toEqual(expected)
                })
                test.each(stringCases)('%p', (pattern) => {
                    const basicRules = [
                        { target: 'replicas', gqlOperationName: pattern },
                        { target: 'main' },
                    ]

                    expect(getQueryRoutingRules(basicRules, basicPoolConfig)).toEqual(basicRules)
                })
            })
        })
    })
})