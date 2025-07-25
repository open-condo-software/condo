const { faker } = require('@faker-js/faker')
const { gql } = require('graphql-tag')

const {
    makeClient,
    makeLoggedInAdminClient,
    expectToThrowGQLErrorToResult, expectToThrowGraphQLRequestError,
} = require('@open-condo/keystone/test.utils')

const { STAFF, SERVICE, RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql')
const {
    createTestUser,
    User,
    createTestPhone,
    createTestResetUserLimitAction,
    authenticateUserWithPhoneAndPasswordByTestClient,
    resetUserByTestClient,
} = require('@condo/domains/user/utils/testSchema')


describe('Auth by phone and password', () => {
    // We need to check that token is also returned. It's the same as SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION
    const AUTHENTICATE_WITH_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN = gql`
        mutation authenticateUserWithPhoneAndPassword ($data: AuthenticateUserWithPhoneAndPasswordInput!) {
            result: authenticateUserWithPhoneAndPassword(data: $data) {
                item {
                    id
                }
            }
        }
    `

    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Accesses', () => {
        test('Anonymous (anyone)', async () => {
            const [user, userAttrs] = await createTestUser(admin)

            const [res] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: STAFF,
            })
            expect(res.item.id).toBe(user.id)
            expect(res.token).not.toBeNull()
        })
    })

    describe('Basic logic', () => {

        describe.each(USER_TYPES)('For user type %p', (userType) => {
            test('should throw error if user was soft deleted', async () => {
                const [user, userAttrs] = await createTestUser(admin, { type: userType })
                const [deletedUser] = await User.softDelete(admin, user.id)
                expect(deletedUser.deletedAt).not.toBeNull()
                await expectToThrowGQLErrorToResult(async () => {
                    await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                        phone: userAttrs.phone,
                        password: userAttrs.password,
                        userType: userAttrs.type,
                    })
                }, {
                    mutation: 'authenticateUserWithPhoneAndPassword',
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_CREDENTIALS',
                })
            })

            test('should throw error if user was reset (or user not registered with same phone)', async () => {
                const [user, userAttrs] = await createTestUser(admin, { type: userType })
                await resetUserByTestClient(admin, { user: { id: user.id } })
                const users = await User.getAll(admin, { phone: userAttrs.phone })
                expect(users).toHaveLength(0)

                await expectToThrowGQLErrorToResult(async () => {
                    await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                        phone: userAttrs.phone,
                        password: userAttrs.password,
                        userType: userAttrs.type,
                    })
                }, {
                    mutation: 'authenticateUserWithPhoneAndPassword',
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_CREDENTIALS',
                })
            })

            test('should throw error if user has not password', async () => {
                const [, userAttrs] = await createTestUser(admin, { password: undefined, type: userType })

                await expectToThrowGQLErrorToResult(async () => {
                    await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                        phone: userAttrs.phone,
                        password: '',
                        userType: userAttrs.type,
                    })
                }, {
                    mutation: 'authenticateUserWithPhoneAndPassword',
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_CREDENTIALS',
                })
            })

            test('should throw error if password is incorrect', async () => {
                const [, userAttrs] = await createTestUser(admin, { type: userType })

                await expectToThrowGQLErrorToResult(async () => {
                    await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                        phone: userAttrs.phone,
                        password: userAttrs.password + faker.random.alphaNumeric(8),
                        userType: userAttrs.type,
                    })
                }, {
                    mutation: 'authenticateUserWithPhoneAndPassword',
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_CREDENTIALS',
                })
            })

            test('should throw error if phone is not valid', async () => {
                const [, userAttrs] = await createTestUser(admin, { type: userType })

                await expectToThrowGQLErrorToResult(async () => {
                    await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                        phone: userAttrs.phone + 'not-phone' + faker.random.alphaNumeric(8),
                        password: userAttrs.password,
                        userType: userAttrs.type,
                    })
                }, {
                    mutation: 'authenticateUserWithPhoneAndPassword',
                    code: 'BAD_USER_INPUT',
                    type: 'WRONG_PHONE_FORMAT',
                })
            })

            test('should authorize user and return token if password and phone number are correct', async () => {
                const [user, userAttrs] = await createTestUser(admin, { type: userType })
                const anonymousClient = await makeClient()

                const result = await anonymousClient.mutate(AUTHENTICATE_WITH_PHONE_AND_PASSWORD_MUTATION_WITH_TOKEN, {
                    data: {
                        phone: userAttrs.phone,
                        password: userAttrs.password,
                        userType: userAttrs.type,
                    },
                })

                expect(result.data.result.item.id).toBe(user.id)
                expect(result.data.result.token).not.toBeNull()
            })
        })

        test('should authorize user if dv or sender not passed', async () => {
            const [user, userAttrs] = await createTestUser(admin, { type: STAFF })

            const [result] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: userAttrs.type,
                dv: undefined,
                sender: undefined,
            })

            expect(result.item.id).toBe(user.id)
        })

        test('should throw error if dv or sender not valid', async () => {
            const [, userAttrs] = await createTestUser(admin, { type: STAFF })

            await expectToThrowGQLErrorToResult(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                    phone: userAttrs.phone + 'not-phone' + faker.random.alphaNumeric(8),
                    password: userAttrs.password,
                    userType: userAttrs.type,
                    dv: 123,
                })
            }, {
                mutation: 'authenticateUserWithPhoneAndPassword',
                variable: ['data', 'dv'],
                code: 'BAD_USER_INPUT',
                type: 'DV_VERSION_MISMATCH',
            })

            await expectToThrowGQLErrorToResult(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                    phone: userAttrs.phone + 'not-phone' + faker.random.alphaNumeric(8),
                    password: userAttrs.password,
                    userType: userAttrs.type,
                    sender: { dv: 1, fingerprint: '-' },
                })
            }, {
                mutation: 'authenticateUserWithPhoneAndPassword',
                variable: ['data', 'sender'],
                code: 'BAD_USER_INPUT',
                type: 'WRONG_FORMAT',
            })
        })

        test('should authorize user with type "staff" if userType is not passed', async () => {
            const [staff, userAttrs] = await createTestUser(admin, { type: STAFF })
            await createTestUser(admin, { type: RESIDENT, phone: userAttrs.phone })
            await createTestUser(admin, { type: SERVICE, phone: userAttrs.phone })

            const [result] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: undefined,
            })

            expect(result.item.id).toBe(staff.id)
        })

        test('should throw error if userType is not valid', async () => {
            const [, userAttrs] = await createTestUser(admin, { type: STAFF })

            await expectToThrowGraphQLRequestError(async () => {
                await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                    phone: userAttrs.phone + 'not-phone' + faker.random.alphaNumeric(8),
                    password: userAttrs.password,
                    userType: 'not-valid-user-type',
                })
            }, 'Value "not-valid-user-type" does not exist in "UserTypeType" enum')
        })

        test('should authorize user with with the specified type', async () => {
            const [staff, userAttrs] = await createTestUser(admin, { type: STAFF })
            const [resident] = await createTestUser(admin, { type: RESIDENT, phone: userAttrs.phone, password: userAttrs.password })
            const [service] = await createTestUser(admin, { type: SERVICE, phone: userAttrs.phone, password: userAttrs.password })

            const [authedStaff] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: STAFF,
            })
            expect(authedStaff.item.id).toBe(staff.id)

            const [authedResident] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: RESIDENT,
            })
            expect(authedResident.item.id).toBe(resident.id)

            const [authedService] = await authenticateUserWithPhoneAndPasswordByTestClient(await makeClient(), {
                phone: userAttrs.phone,
                password: userAttrs.password,
                userType: SERVICE,
            })
            expect(authedService.item.id).toBe(service.id)
        })
    })

    describe('Guards', () => {
        const GUARD_WINDOW_LIMIT = 10

        describe('by ip', () => {
            test('works fine', async () => {
                const client = await makeClient()

                for await (const i of Array.from(Array(GUARD_WINDOW_LIMIT).keys())) {
                    const phone = createTestPhone()
                    const password = faker.datatype.string(42)

                    const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })

                    if (i === GUARD_WINDOW_LIMIT) {
                        expect(errors).toHaveLength(1)
                        expect(errors[0]).toMatchObject(expect.objectContaining({
                            message: expect.stringMatching(/You have to wait \d{1,4} min. to be able to send request again/),
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

                    const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })
                    lockErrors = errors
                }

                // Ensure that lock works fine
                expect(lockErrors).toHaveLength(1)
                expect(lockErrors[0]).toMatchObject(expect.objectContaining({
                    message: expect.stringMatching(/You have to wait \d{1,4} min. to be able to send request again/),
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
                const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })
                expect(errors).toHaveLength(1)
                expect(errors[0]).toMatchObject(expect.objectContaining({
                    message: 'Wrong phone or password',
                    extensions: expect.objectContaining({
                        type: 'WRONG_CREDENTIALS',
                        messageForUserTemplateKey: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
                    }),
                }))
            })
        })

        describe('by phone', () => {
            test('works fine', async () => {
                const phone = createTestPhone()

                for await (const i of Array.from(Array(GUARD_WINDOW_LIMIT).keys())) {
                    const client = await makeClient()
                    const password = faker.datatype.string(42)

                    const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })

                    if (i === GUARD_WINDOW_LIMIT) {
                        expect(errors).toHaveLength(1)
                        expect(errors[0]).toMatchObject(expect.objectContaining({
                            message: expect.stringMatching(/You have to wait \d{1,4} min. to be able to send request again/),
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
                const phone = createTestPhone()
                const admin = await makeLoggedInAdminClient()

                // Reach the lock
                let lockErrors
                for (let i = 0; i <= GUARD_WINDOW_LIMIT; i++) {
                    const client = await makeClient()
                    const password = faker.datatype.string(42)

                    const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })
                    lockErrors = errors
                }

                // Ensure that lock works fine
                expect(lockErrors).toHaveLength(1)
                expect(lockErrors[0]).toMatchObject(expect.objectContaining({
                    message: expect.stringMatching(/You have to wait \d{1,4} min. to be able to send request again/),
                    extensions: expect.objectContaining({
                        type: 'TOO_MANY_REQUESTS',
                        messageForUserTemplateKey: 'api.user.TOO_MANY_REQUESTS',
                    }),
                }))

                // Reset lock
                await createTestResetUserLimitAction(admin, AUTH_COUNTER_LIMIT_TYPE, phone)

                // Ensure that no more lock
                const client = await makeClient()
                const password = faker.datatype.string(42)
                const { errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, { data: { phone, password } })
                expect(errors).toHaveLength(1)
                expect(errors[0]).toMatchObject(expect.objectContaining({
                    message: 'Wrong phone or password',
                    extensions: expect.objectContaining({
                        type: 'WRONG_CREDENTIALS',
                        messageForUserTemplateKey: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
                    }),
                }))
            })
        })
    })
})
