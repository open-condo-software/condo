const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowGQLError,
    expectToThrowGraphQLRequestError,
} = require('@open-condo/keystone/test.utils')

const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const {
    makeLoggedInClient,
    createTestConfirmPhoneAction,
    ConfirmPhoneAction,
    User,
    createTestUser,
    changePasswordWithTokenByTestClient,
    authenticateUserWithPhoneAndPasswordByTestClient,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./ForgotPasswordService')


describe('ForgotPasswordAction Service', () => {
    describe('mutation changePasswordWithToken', () => {
        let adminClient, anonymousClient, user, userAttrs

        beforeAll(async () => {
            adminClient = await makeLoggedInAdminClient()
        })

        beforeEach(async () => {
            [user, userAttrs] = await createTestUser(adminClient)
            anonymousClient = await makeClient()
        })

        describe('Accesses', () => {
            describe('User', () => {
                test('can execute', async () => {
                    const userClient = await makeLoggedInClient({
                        phone: userAttrs.phone,
                        password: userAttrs.password,
                    })
                    const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userClient.user.phone,
                    })
                    const [result] = await changePasswordWithTokenByTestClient(userClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                    expect(result).toEqual({ status: 'ok', phone: userClient.user.phone })
                })
            })

            describe('Anonymous (anyone)', () => {
                test('can execute', async () => {
                    const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const [result] = await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                    expect(result).toEqual({ status: 'ok', phone: userAttrs.phone })
                })
            })
        })

        describe('Basic logic', () => {
            test('should change password only for staff user by phone', async () => {
                const [residentUser] = await createTestUser(adminClient, { phone: userAttrs.phone, type: RESIDENT })
                const [serviceUser] = await createTestUser(adminClient, { phone: userAttrs.phone, type: SERVICE })
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                const newPassword = faker.internet.password()
                const [result] = await changePasswordWithTokenByTestClient(anonymousClient, {
                    token: confirmPhoneAction.token,
                    password: newPassword,
                })
                expect(result).toEqual({ status: 'ok', phone: userAttrs.phone })

                const [res] = await authenticateUserWithPhoneAndPasswordByTestClient(anonymousClient, {
                    phone: userAttrs.phone,
                    password: newPassword,
                })
                expect(res.item.id).toBe(user.id)

                const resident = await User.getOne(adminClient, { id: residentUser.id })
                expect(resident.updatedAt).toBe(resident.createdAt)
                const service = await User.getOne(adminClient, { id: serviceUser.id })
                expect(service.updatedAt).toBe(service.createdAt)
            })

            test('should throw error for resident user by phone', async () => {
                const [residentUser, userAttrs] = await createTestUser(adminClient, { type: RESIDENT })
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.USER_NOT_FOUND, 'result')
            })

            test('should throw error for service user by phone', async () => {
                const [serviceUser, userAttrs] = await createTestUser(adminClient, { type: SERVICE })
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.USER_NOT_FOUND, 'result')
            })

            test('should throw error if user is not exist', async () => {
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.USER_NOT_FOUND, 'result')
            })

            test('should throw error if user is deleted', async () => {
                await User.softDelete(adminClient, user.id)
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.USER_NOT_FOUND, 'result')
            })

            test('confirmPhoneAction should be marked as used after changePasswordWithToken has been executed', async () => {
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                const [result] = await changePasswordWithTokenByTestClient(anonymousClient, {
                    token: confirmPhoneAction.token,
                    password: faker.internet.password(),
                })
                expect(result).toEqual({ status: 'ok', phone: userAttrs.phone })
                const updatedConfirmPhoneAction = await ConfirmPhoneAction.getOne(adminClient, { token: confirmPhoneAction.token })
                expect(updatedConfirmPhoneAction.completedAt).not.toBeNull()
            })

            test('should throw error if phone token is used', async () => {
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                })
                const [result] = await changePasswordWithTokenByTestClient(anonymousClient, {
                    token: confirmPhoneAction.token,
                    password: faker.internet.password(),
                })
                expect(result).toEqual({ status: 'ok', phone: userAttrs.phone })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, 'result')
            })

            test('should throw error if phone token is expired', async () => {
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    isPhoneVerified: true,
                    phone: userAttrs.phone,
                    expiresAt: new Date().toISOString(),
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, 'result')
            })

            test('should throw error if phone token is not confirmed', async () => {
                const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                    phone: userAttrs.phone,
                })
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: confirmPhoneAction.token,
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, 'result')
            })

            test('should throw error if phone token is not exist', async () => {
                await expectToThrowGQLError(async () => {
                    await changePasswordWithTokenByTestClient(anonymousClient, {
                        token: faker.random.alphaNumeric(8),
                        password: faker.internet.password(),
                    })
                }, ERRORS.changePasswordWithToken.TOKEN_NOT_FOUND, 'result')
            })
        })

        describe('Validation fields', () => {
            describe('Password', () => {
                test('change to empty password', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = ''

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                        'result',
                    )
                })

                test('change to weak password', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = '123456789'

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.PASSWORD_IS_FREQUENTLY_USED,
                        'result',
                    )
                })

                test('change to short password', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = faker.internet.password(MIN_PASSWORD_LENGTH - 1)

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                        'result',
                    )
                })

                test('change to password starting or ending with a space', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = '  ' + faker.internet.password() + '  '

                    const [result] = await changePasswordWithTokenByTestClient(anonymousClient, { token, password })
                    expect(result.status).toBe('ok')
                })

                test('change to very long password', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = faker.internet.password(MAX_PASSWORD_LENGTH + 1)

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                        'result',
                    )
                })

                test('change to password that does not containing at least 4 different characters', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = '12331212312123'

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
                        'result',
                    )
                })

                test('change to password containing email', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = userAttrs.email + faker.internet.password()

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_EMAIL,
                        'result',
                    )
                })

                test('change to password containing phone', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = userAttrs.phone + faker.internet.password()

                    await expectToThrowGQLError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_PHONE,
                        'result',
                    )
                })

                test('change to wrong format password', async () => {
                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        isPhoneVerified: true,
                        phone: userAttrs.phone,
                    })
                    const password = faker.datatype.number()

                    await expectToThrowGraphQLRequestError(
                        async () => await changePasswordWithTokenByTestClient(anonymousClient, { token, password }),
                        '"data.password"; String cannot represent a non string value',
                    )
                })
            })
        })
    })
})
