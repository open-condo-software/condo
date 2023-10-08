const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient, expectToThrowGQLError, expectToThrowGraphQLRequestError } = require('@open-condo/keystone/test.utils')

const { MIN_PASSWORD_LENGTH, RESIDENT } = require('@condo/domains/user/constants/common')
const { MAX_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { START_PASSWORD_RECOVERY_MUTATION, CHANGE_PASSWORD_WITH_TOKEN_MUTATION, CHECK_PASSWORD_RECOVERY_TOKEN, COMPLETE_CONFIRM_PHONE_MUTATION } = require('@condo/domains/user/gql')
const { makeLoggedInClient, createTestConfirmPhoneAction, ConfirmPhoneAction } = require('@condo/domains/user/utils/testSchema')
const { User, createTestForgotPasswordAction, updateTestForgotPasswordAction, createTestUser, changePasswordWithTokenByTestClient } = require('@condo/domains/user/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./ForgotPasswordService')


const captcha = () => {
    return faker.lorem.sentence()
}

describe('ForgotPasswordAction Service', () => {
    describe('User', () => {
        it('can create forgot password recovery action', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)
            const result = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, {
                data: { phone: userAttrs.phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } },
            })
            expect(result.data.result).toEqual({ status: 'ok' })
        })

        it('can reset forgotten password', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`
            const [result] = await changePasswordWithTokenByTestClient(client, { token, password, dv: 1, sender: { dv: 1, fingerprint: 'tests' }  })
            expect(result).toEqual({ status: 'ok', phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)
        })

        it('cannot change password with expired token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token, id }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`

            await updateTestForgotPasswordAction(admin, id, { expiresAt: new Date(Date.now()).toISOString() })
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password, dv: 1, sender: { dv: 1, fingerprint: 'tests' } } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })

        it('cannot change password to a shorter one', async () =>  {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = userAttrs.password.slice(0, MIN_PASSWORD_LENGTH - 1)
            await expectToThrowGQLError(
                async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                'result'
            )
        })

        it('can check token expired status', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const result = await client.mutate(CHECK_PASSWORD_RECOVERY_TOKEN, { data: { token } })
            expect(result.data.result).toEqual({ status: 'ok' })
        })

        it('cannot change password to empty', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            await expectToThrowGQLError(
                async () => await changePasswordWithTokenByTestClient(client, { token, password: '' }),
                ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                'result'
            )
        })
    })
    describe('Anonymous', () => {
        it('can create forgot password recovery action', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()
            const result = await client.mutate(START_PASSWORD_RECOVERY_MUTATION, {
                data: { phone: userAttrs.phone, dv: 1, sender: { dv: 1, fingerprint: 'tests' } },
            })
            expect(result.data.result).toEqual({ status: 'ok' })
        })

        it('can reset forgotten password', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`
            const [result] = await changePasswordWithTokenByTestClient(client, { token, password })
            expect(result).toEqual({ status: 'ok', phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)
        })

        it('cannot change password with one token more than one time', async ()=> {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`

            const [result] = await changePasswordWithTokenByTestClient(client, { token, password })
            expect(result).toEqual({ status: 'ok', phone:  userAttrs.phone })

            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password, dv: 1, sender: { dv: 1, fingerprint: 'tests' } } })

            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })

        it('cannot change password with expired token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, id }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`

            await updateTestForgotPasswordAction(admin, id, { expiresAt: new Date(Date.now()).toISOString() })
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password, dv: 1, sender: { dv: 1, fingerprint: 'tests' } } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })

        it('cannot change password to a shorter one', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = userAttrs.password.slice(0, MIN_PASSWORD_LENGTH - 1)
            await expectToThrowGQLError(
                async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                'result'
            )
        })

        it('can check token expired status', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const result = await client.mutate(CHECK_PASSWORD_RECOVERY_TOKEN, { data: { token } })
            expect(result.data.result).toEqual({ status: 'ok' })
        })

        it('cannot change password to empty', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            await expectToThrowGQLError(
                async () => await changePasswordWithTokenByTestClient(client, { token, password: '' }),
                ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                'result'
            )
        })
        
        it('cannot change password to weak password', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user] = await createTestUser(admin)
            const client = await makeClient()
            const weakPassword = '123456789'

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            await expectToThrowGQLError(
                async () => await changePasswordWithTokenByTestClient(client, { token, password: weakPassword }),
                ERRORS.changePasswordWithToken.PASSWORD_IS_FREQUENTLY_USED,
                'result'
            )
        })

        it('can change password with ConfirmPhoneAction', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, smsCode }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')

            const password = `new_${userAttrs.password}`
            const [result] = await changePasswordWithTokenByTestClient(client, { token, password })
            expect(result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)
        })

        it('cannot change password when action is not confirmed', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const password = `new_${userAttrs.password}`
            const { data: { result }, errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, password } })
            expect(result).toBeNull()
            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })

        it('cannot change when action token already completed', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, smsCode }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')
            
            const password = `new_${userAttrs.password}`
            const { data } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, password } })
            expect(data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, password } })
            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                },
            }])
        })

        it('cannot change when action token expired', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, smsCode, id: confirmActionId }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { 
                data: {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token,
                    smsCode: smsCode, 
                    captcha: captcha(), 
                }, 
            })
            expect(status).toBe('ok')
            
            await ConfirmPhoneAction.update(admin, confirmActionId, {
                expiresAt: new Date(Date.now()).toISOString(),
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
            })
            
            const password = `new_${userAttrs.password}`
            // TODO(DOMA-3146): use expectToThrowGQLError here and create helper for CHANGE_PASSWORD_WITH_TOKEN_MUTATION
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, dv: 1,
                sender: { dv: 1, fingerprint: 'tests' }, password } })
            expect(errors).toMatchObject([{
                message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                },
            }])
        })

        it('does change only staff member password', async () => {
            const admin = await makeLoggedInAdminClient()
            
            const xiaomiSharedPhone = faker.phone.number('+79#########')

            const [user, userAttrs] = await createTestUser(admin, { phone: xiaomiSharedPhone })
            const [resident] = await createTestUser(admin, { phone: xiaomiSharedPhone, type: RESIDENT, isPhoneVerified: true })

            const client = await makeClient()

            const [{ token, smsCode }] = await createTestConfirmPhoneAction(admin, {
                phone: xiaomiSharedPhone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')

            const password = `new_${userAttrs.password}`
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, dv: 1, sender: { dv: 1, fingerprint: 'tests' }, password } })

            expect(result.data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)

            const [newResident] = await User.getAll(admin, {
                id: resident.id,
            })

            expect(newResident.updatedAt).toEqual(resident.createdAt)
        })
    })

    describe('Validations', () => {
        describe('Password', () => {
            test('change to empty password', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = ''

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                    'result'
                )
            })

            test('change to weak password', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = '123456789'

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.PASSWORD_IS_FREQUENTLY_USED,
                    'result'
                )
            })

            test('change to short password', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = faker.internet.password(MIN_PASSWORD_LENGTH - 1)

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                    'result'
                )
            })

            test('change to password starting or ending with a space', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = '  ' + faker.internet.password() + '  '

                const [result] = await changePasswordWithTokenByTestClient(client, { token, password })
                expect(result.status).toBe('ok')
            })

            test('change to very long password', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = faker.internet.password(MAX_PASSWORD_LENGTH + 1)

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.INVALID_PASSWORD_LENGTH,
                    'result'
                )
            })

            test('change to password that does not containing at least 4 different characters', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = '12331212312123'

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.PASSWORD_CONSISTS_OF_SMALL_SET_OF_CHARACTERS,
                    'result'
                )
            })

            test('change to password containing email', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = client.userAttrs.email + faker.internet.password()

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_EMAIL,
                    'result'
                )
            })

            test('change to password containing phone', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = client.userAttrs.phone + faker.internet.password()

                await expectToThrowGQLError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    ERRORS.changePasswordWithToken.PASSWORD_CONTAINS_PHONE,
                    'result'
                )
            })

            test('change to wrong format password', async () => {
                const admin = await makeLoggedInAdminClient()
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                const [{ token }] = await createTestForgotPasswordAction(admin, client.user)
                const password = faker.datatype.number()

                await expectToThrowGraphQLRequestError(
                    async () => await changePasswordWithTokenByTestClient(client, { token, password }),
                    '"data.password"; String cannot represent a non string value'
                )
            })
        })
    })
})
