const { faker } = require('@faker-js/faker')
const { gql } = require('graphql-tag')

const {
    makeClient,
    makeLoggedInAdminClient, waitFor,
} = require('@open-condo/keystone/test.utils')

const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')
const {
    createTestUser,
    User,
    createTestPhone,
    createTestResetUserLimitAction,
} = require('@condo/domains/user/utils/testSchema')

describe('Auth by phone and password', () => {
    // We need to check that token is also returned for mobile phones. It's the same as SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION
    const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN = gql`
        mutation authenticateUserWithPhoneAndPassword ($phone: String!, $password: String!) {
            obj: authenticateUserWithPhoneAndPassword(data: { phone: $phone, password: $password }) {
                item {
                    id
                }
                token
            }
        }
    `

    test('soft deleted user cannot be authorized', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const [deletedUser] = await User.softDelete(admin, user.id)
        expect(deletedUser.deletedAt).not.toBeNull()
        const client = await makeClient()
        const res = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password })
        expect(res.data.obj).toBeNull()
        expect(res.errors[0].message).toBe('Wrong phone or password')
    })

    test('user without password cannot be authorized', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin, { password: undefined })
        const { phone } = userAttrs
        const client = await makeClient()
        const res = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password: '' })
        expect(res.data.obj).toBeNull()
        expect(res.errors[0].message).toBe('Wrong phone or password')
    })

    test('valid password', async () => {
        const admin = await makeLoggedInAdminClient()
        const [user, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const res1 = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, { phone, password })
        expect(res1.errors).toEqual(undefined)
        expect(res1.data.obj.item.id).toEqual(user.id)
        expect(res1.data.obj.token).not.toHaveLength(0)
    })

    test('not valid credentials (phone)', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: createTestPhone(),
            password,
        })
        expect(errors).toMatchObject([{
            message: 'Wrong phone or password',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                message: 'Wrong phone or password',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            },
        }])
    })

    test('not valid credentials (password)', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone,
            password: password + Math.random(),
        })
        expect(errors).toMatchObject([{
            message: 'Wrong phone or password',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                message: 'Wrong phone or password',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_CREDENTIALS',
            },
        }])
    })

    test('not valid phone', async () => {
        const admin = await makeLoggedInAdminClient()
        const [, userAttrs] = await createTestUser(admin)
        const { phone, password } = userAttrs
        const client = await makeClient()
        const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: phone + Math.random(),
            password,
        })
        expect(errors).toMatchObject([{
            message: 'Wrong format of provided phone number',
            name: 'GQLError',
            path: ['obj'],
            extensions: {
                mutation: 'authenticateUserWithPhoneAndPassword',
                code: 'BAD_USER_INPUT',
                type: 'WRONG_PHONE_FORMAT',
                variable: ['data', 'phone'],
            },
        }])
    })

    describe('ip guard', () => {
        const GUARD_WINDOW_LIMIT = 10

        test('works fine', async () => {
            const client = await makeClient()

            for await (const i of Array.from(Array(GUARD_WINDOW_LIMIT).keys())) {
                const phone = createTestPhone()
                const password = faker.datatype.string(42)

                const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })

                if (i === GUARD_WINDOW_LIMIT) {
                    expect(errors).toHaveLength(1)
                    expect(errors[0]).toMatchObject(expect.objectContaining({
                        message: expect.stringMatching(/You have to wait \d{1,4} seconds to be able to send request again/),
                        extensions: expect.objectContaining({
                            type: 'TOO_MANY_REQUESTS',
                            messageForUserTemplateKey: 'api.user.TOO_MANY_REQUESTS',
                        }),
                    }))
                } else {
                    expect(errors).toHaveLength(1)
                    expect(errors[0]).toMatchObject(expect.objectContaining({
                        message: 'Wrong phone or password',
                        extensions: expect.objectContaining({
                            type: 'WRONG_CREDENTIALS',
                            messageForUserTemplateKey: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
                        }),
                    }))
                }
            }
        })

        test('should be resettable', async () => {
            const client = await makeClient()
            const fakeIp = faker.internet.ip()
            client.setHeaders({ 'x-forwarded-for': fakeIp })
            const admin = await makeLoggedInAdminClient()

            // Reach the lock
            let lockErrors
            for (let i = 0; i <= GUARD_WINDOW_LIMIT; i++) {
                const phone = createTestPhone()
                const password = faker.datatype.string(42)

                const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })
                lockErrors = errors
            }

            // Ensure that lock works fine
            expect(lockErrors).toHaveLength(1)
            expect(lockErrors[0]).toMatchObject(expect.objectContaining({
                message: expect.stringMatching(/You have to wait \d{1,4} seconds to be able to send request again/),
                extensions: expect.objectContaining({
                    type: 'TOO_MANY_REQUESTS',
                    messageForUserTemplateKey: 'api.user.TOO_MANY_REQUESTS',
                }),
            }))

            // Reset lock
            await createTestResetUserLimitAction(admin, AUTH_COUNTER_LIMIT_TYPE, fakeIp)

            // Ensure that no more lock
            const phone = createTestPhone()
            const password = faker.datatype.string(42)
            const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })
            expect(errors).toHaveLength(1)
            expect(errors[0]).toMatchObject(expect.objectContaining({
                message: 'Wrong phone or password',
                extensions: expect.objectContaining({
                    type: 'WRONG_CREDENTIALS',
                    messageForUserTemplateKey: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
                }),
            }))

        })

        describe('can apply custom quota for particular ip address', () => {
            const spy = jest.spyOn(RedisGuard.prototype, 'checkCustomLimitCounters')

            beforeEach(async () => {
                spy.mockClear()
                process.env.PHONE_AND_PASS_AUTH_CUSTOM_QUOTAS = undefined
            })

            afterEach(() => {
                process.env.PHONE_AND_PASS_AUTH_CUSTOM_QUOTAS = undefined
            })

            test('if set only windowLimit', async () => {
                const client = await makeClient()
                const fakeIp = faker.internet.ip()
                client.setHeaders({ 'x-forwarded-for': fakeIp })

                const customLimit = faker.datatype.number()

                process.env.PHONE_AND_PASS_AUTH_CUSTOM_QUOTAS = JSON.stringify({ [fakeIp]: { windowLimit: customLimit } })

                const phone = createTestPhone()
                const password = faker.datatype.string(42)

                await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })

                expect(spy).toHaveBeenCalledTimes(1)
                expect(spy).toHaveBeenCalledWith(`${AUTH_COUNTER_LIMIT_TYPE}:${fakeIp}`, 3600, customLimit, expect.anything())
            })

            test('if set only windowSize', async () => {
                const client = await makeClient()
                const fakeIp = faker.internet.ip()
                client.setHeaders({ 'x-forwarded-for': fakeIp })

                const customSizeSec = faker.datatype.number()

                process.env.PHONE_AND_PASS_AUTH_CUSTOM_QUOTAS = JSON.stringify({ [fakeIp]: { windowSizeSec: customSizeSec } })

                const phone = createTestPhone()
                const password = faker.datatype.string(42)

                await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })

                expect(spy).toHaveBeenCalledTimes(1)
                expect(spy).toHaveBeenCalledWith(`${AUTH_COUNTER_LIMIT_TYPE}:${fakeIp}`, customSizeSec, 10, expect.anything())
            })

            test('if set both: windowSize and windowLimit', async () => {
                const client = await makeClient()
                const fakeIp = faker.internet.ip()
                client.setHeaders({ 'x-forwarded-for': fakeIp })

                const customSizeSec = faker.datatype.number()
                const customLimit = faker.datatype.number()

                process.env.PHONE_AND_PASS_AUTH_CUSTOM_QUOTAS = JSON.stringify({
                    [fakeIp]: {
                        windowSizeSec: customSizeSec,
                        windowLimit: customLimit,
                    },
                })

                const phone = createTestPhone()
                const password = faker.datatype.string(42)

                await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { phone, password })

                expect(spy).toHaveBeenCalledTimes(1)
                expect(spy).toHaveBeenCalledWith(`${AUTH_COUNTER_LIMIT_TYPE}:${fakeIp}`, customSizeSec, customLimit, expect.anything())
            })
        })
    })
})
