const { KnexPool } = require('./pool')

function generateFakeKnexClient () {
    const calls = []
    const knexClient = {
        client: {
            runner (builder) {
                calls.push(builder)
                return builder
            },
        },
    }

    return [knexClient, calls]
}

function generateDummyBuilder () {
    return { name: 'dummy' }
}

describe('KnexPool', () => {
    let knexClients = []
    let knexCalls = []
    beforeEach(() => {
        const [firstClient, firstCalls] = generateFakeKnexClient()
        const [secondClient, secondCalls] = generateFakeKnexClient()
        const [thirdClient, thirdCalls] = generateFakeKnexClient()
        knexClients = [firstClient, secondClient, thirdClient]
        knexCalls = [firstCalls, secondCalls, thirdCalls]
    })
    afterEach(() => {
        knexClients = []
        knexCalls = []
    })
    describe('Can be initialized with different balancers', () => {
        describe('RoundRobin', () => {
            test.each([true, false])('writeable: %p', (writable) => {
                const pool = new KnexPool({
                    knexClients,
                    writable,
                    balancer: 'RoundRobin',
                    balancerOptions: {},
                })
                expect(pool).toBeDefined()
            })
        })
    })
    describe('Must select executors properly', () => {
        const cycles = 25_000

        describe(`RoundRobin stress test (iterations = ${cycles})`, () => {
            test('getKnexClient', () => {
                const pool = new KnexPool({
                    knexClients,
                    writable: true,
                    balancer: 'RoundRobin',
                    balancerOptions: {},
                })

                for (let i = 0; i < cycles * knexClients.length; i++) {
                    const expected = knexClients[i % knexClients.length]
                    const client = pool.getKnexClient()
                    expect(client === expected).toEqual(true)
                }
            })
            test('getQueryRunner', () => {
                const pool = new KnexPool({
                    knexClients,
                    writable: true,
                    balancer: 'RoundRobin',
                    balancerOptions: {},
                })

                for (let i = 0; i < cycles * knexClients.length; i++) {
                    const expectedCallStack = knexCalls[i % knexClients.length]
                    const lengthBefore = expectedCallStack.length
                    pool.getQueryRunner(generateDummyBuilder())
                    expect(expectedCallStack).toHaveLength(lengthBefore + 1)
                }
            })
        })
    })
})