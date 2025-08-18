const { faker } = require('@faker-js/faker')

const { checkAuthRateLimits } = require('./routes')

function createMockResponse () {
    return {}
}


function createMockRequest ({
    method = 'GET',
    headers = {},
    query = {},
    params = { provider: faker.random.word() },
    session = {},
    ip = faker.internet.ip(),
    user = { id: faker.datatype.uuid() },
} = {}) {
    return {
        method,
        headers,
        query,
        params,
        session,
        ip,
        user,
    }
}

const EXPECTED_CALLS_TO_BAN = 11

describe('Passport express routes utils', () => {
    describe('checkAuthRateLimits', () => {
        let next
        let res
        beforeEach(() => {
            next = jest.fn()
            res = createMockResponse()
        })
        test('Must pass for different users / IPs', async () => {
            for (let i = 0; i < EXPECTED_CALLS_TO_BAN * 3; i++) {
                await checkAuthRateLimits(createMockRequest(), res, next)
            }
            expect(next).toBeCalledTimes(EXPECTED_CALLS_TO_BAN * 3)
            expect(next.mock.calls)
                .toEqual(Array.from({ length: EXPECTED_CALLS_TO_BAN * 3 }, () => []))
        })
        test('Must check limit by IP', async () => {
            const ip = faker.internet.ip()
            for (let i = 0; i < EXPECTED_CALLS_TO_BAN; i++) {
                await checkAuthRateLimits(createMockRequest({ ip }), res, next)
            }
            expect(next).toBeCalledTimes(EXPECTED_CALLS_TO_BAN)
            expect(next.mock.calls.slice(0, EXPECTED_CALLS_TO_BAN - 1))
                .toEqual(Array.from({ length: EXPECTED_CALLS_TO_BAN - 1 }, () => []))
            const lastCall = next.mock.calls[EXPECTED_CALLS_TO_BAN - 1]
            expect(lastCall).toHaveLength(1)
            expect(lastCall[0]).toEqual(expect.objectContaining({
                name: 'GQLError',
                extensions: expect.objectContaining({
                    code: 'BAD_USER_INPUT',
                    type: 'TOO_MANY_REQUESTS',
                }),
            }))
        })
        test('Must check limit by user id', async () => {
            const user = { id: faker.datatype.uuid() }
            for (let i = 0; i < EXPECTED_CALLS_TO_BAN; i++) {
                await checkAuthRateLimits(createMockRequest({ user }), res, next)
            }
            expect(next).toBeCalledTimes(EXPECTED_CALLS_TO_BAN)
            expect(next.mock.calls.slice(0, EXPECTED_CALLS_TO_BAN - 1))
                .toEqual(Array.from({ length: EXPECTED_CALLS_TO_BAN - 1 }, () => []))
            const lastCall = next.mock.calls[EXPECTED_CALLS_TO_BAN - 1]
            expect(lastCall).toHaveLength(1)
            expect(lastCall[0]).toEqual(expect.objectContaining({
                name: 'GQLError',
                extensions: expect.objectContaining({
                    code: 'BAD_USER_INPUT',
                    type: 'TOO_MANY_REQUESTS',
                }),
            }))
        })
    })
})