const { MIN_PASSWORD_LENGTH, RESIDENT } = require('@condo/domains/user/constants/common')
const { makeLoggedInClient, createTestConfirmPhoneAction, ConfirmPhoneAction } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { User, createTestForgotPasswordAction, updateTestForgotPasswordAction, createTestUser } = require('@condo/domains/user/utils/testSchema')
const { START_PASSWORD_RECOVERY_MUTATION, CHANGE_PASSWORD_WITH_TOKEN_MUTATION, CHECK_PASSWORD_RECOVERY_TOKEN, COMPLETE_CONFIRM_PHONE_MUTATION } = require('@condo/domains/user/gql')
const faker = require('faker')

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
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.data.result).toEqual({ status: 'ok', phone:  userAttrs.phone })

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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: `Password length is less then ${MIN_PASSWORD_LENGTH} characters`,
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'password'],
                    code: 'BAD_USER_INPUT',
                },
            }])
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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password: '' } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: `Password length is less then ${MIN_PASSWORD_LENGTH} characters`,
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    message: 'Password length is less then {min} characters',
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'password'],
                    code: 'BAD_USER_INPUT',
                },
            }])
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
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)
        })

        it('cannot change password with one token more than one time', async ()=> {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`

            const { data: { result } } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result).toEqual({ status: 'ok', phone:  userAttrs.phone })

            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })

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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: `Password length is less then ${MIN_PASSWORD_LENGTH} characters`,
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'password'],
                    code: 'BAD_USER_INPUT',
                },
            }])
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
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password: '' } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: `Password length is less then ${MIN_PASSWORD_LENGTH} characters`,
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'password'],
                    code: 'BAD_USER_INPUT',
                },
            }])
        })
        
        it('cannot change password to weak password', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password: '123456789' } })
            expect(errors).toHaveLength(1)
            expect(errors).toMatchObject([{
                message: 'The password is too simple. We found it in the list of stolen passwords. You need to use something more secure',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'changePasswordWithToken',
                    variable: ['data', 'password'],
                    code: 'BAD_USER_INPUT',
                },
            }])
        })

        it('can change password with ConfirmPhoneAction', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, smsCode }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')

            const password = `new_${userAttrs.password}`
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })

            expect(result.data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)
        })

        it('cannot change password when action is not confirmed', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const password = `new_${userAttrs.password}`
            const { data: { result }, errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
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

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')
            
            const password = `new_${userAttrs.password}`
            const { data } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
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
                    token, 
                    smsCode: smsCode, 
                    captcha: captcha(), 
                }, 
            })
            expect(status).toBe('ok')
            
            await ConfirmPhoneAction.update(admin, confirmActionId, {
                expiresAt: new Date(Date.now()).toISOString(),
            })
            
            const password = `new_${userAttrs.password}`
            // TODO(DOMA-3146): use expectToThrowGQLError here and create helper for CHANGE_PASSWORD_WITH_TOKEN_MUTATION
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
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
            
            const xiaomiSharedPhone = faker.phone.phoneNumber('+79#########')

            const [user, userAttrs] = await createTestUser(admin, { phone: xiaomiSharedPhone })
            const [resident] = await createTestUser(admin, { phone: xiaomiSharedPhone, type: RESIDENT, isPhoneVerified: true })

            const client = await makeClient()

            const [{ token, smsCode }] = await createTestConfirmPhoneAction(admin, {
                phone: xiaomiSharedPhone,
            })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, smsCode, captcha: captcha() } })
            expect(status).toBe('ok')

            const password = `new_${userAttrs.password}`
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })

            expect(result.data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const newClient = await makeLoggedInClient({ phone: userAttrs.phone, password })
            expect(newClient.user.id).toEqual(user.id)

            const [newResident] = await User.getAll(admin, {
                id: resident.id,
            })

            expect(newResident.updatedAt).toEqual(resident.createdAt)
        })
    })
})
