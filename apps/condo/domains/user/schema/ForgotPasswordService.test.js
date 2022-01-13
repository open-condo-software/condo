import { PASSWORD_TOO_SHORT, RESET_TOKEN_NOT_FOUND } from '@condo/domains/user/constants/errors'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
const { makeLoggedInClient, createTestConfirmPhoneAction, ConfirmPhoneAction } = require('@condo/domains/user/utils/testSchema')
const { makeLoggedInAdminClient, makeClient } = require('@core/keystone/test.utils')
const { createTestForgotPasswordAction, updateTestForgotPasswordAction, createTestUser } = require('@condo/domains/user/utils/testSchema')

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
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${RESET_TOKEN_NOT_FOUND}] Unable to find valid token`)
        })

        it('cannot change password to a shorter one', async () =>  {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeLoggedInClient(userAttrs)

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = userAttrs.password.slice(0, MIN_PASSWORD_LENGTH - 1)
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${PASSWORD_TOO_SHORT}] Password is too short`)
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
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password: '' } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${PASSWORD_TOO_SHORT}] Password is too short`)
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
            let result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.data.result).toEqual({ status: 'ok', phone:  userAttrs.phone })
            result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })

            expect(result.errors[0].message).toEqual(`${RESET_TOKEN_NOT_FOUND}] Unable to find valid token`)
        })

        it('cannot change password with expired token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token, id }] = await createTestForgotPasswordAction(admin, user)
            const password = `new_${userAttrs.password}`

            await updateTestForgotPasswordAction(admin, id, { expiresAt: new Date(Date.now()).toISOString() })
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${RESET_TOKEN_NOT_FOUND}] Unable to find valid token`)
        })

        it('cannot change password to a shorter one', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestForgotPasswordAction(admin, user)
            const password = userAttrs.password.slice(0, MIN_PASSWORD_LENGTH - 1)
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${PASSWORD_TOO_SHORT}] Password is too short`)
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
            const result = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password: '' } })
            expect(result.errors).toHaveLength(1)
            expect(result.errors[0].message).toEqual(`${PASSWORD_TOO_SHORT}] Password is too short`)
        })
        
        it('can change password with ConfirmPhoneAction', async () => {
            const admin = await makeLoggedInAdminClient()
            const [user, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })
            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, smsCode: actionBefore.smsCode, captcha: captcha() } })
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
            const { data, errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(errors).toHaveLength(1)
            expect(data).toBeNull()
        })

        it('cannot change when action token already completed', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { data: { token, smsCode: actionBefore.smsCode, captcha: captcha() } })
            expect(status).toBe('ok')
            
            const password = `new_${userAttrs.password}`
            const { data } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(data.result).toEqual({ status: 'ok',  phone:  userAttrs.phone })

            const { errors2 } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(errors2[0].message).toEqual(`${RESET_TOKEN_NOT_FOUND}] Unable to find valid token`)
        })
        it('cannot change when action token expired', async () => {
            const admin = await makeLoggedInAdminClient()
            const [, userAttrs] = await createTestUser(admin)
            const client = await makeClient()

            const [{ token }] = await createTestConfirmPhoneAction(admin, {
                phone: userAttrs.phone,
            })

            const [actionBefore] = await ConfirmPhoneAction.getAll(admin, { token })

            const { data: { result: { status } } } = await client.mutate(COMPLETE_CONFIRM_PHONE_MUTATION, { 
                data: {
                    token, 
                    smsCode: actionBefore.smsCode, 
                    captcha: captcha(), 
                }, 
            })
            expect(status).toBe('ok')
            
            await ConfirmPhoneAction.update(admin, actionBefore.id, {
                expiresAt: new Date(Date.now()).toISOString(),
            })
            
            const password = `new_${userAttrs.password}`
            const { errors } = await client.mutate(CHANGE_PASSWORD_WITH_TOKEN_MUTATION, { data: { token, password } })
            expect(errors[0].message).toEqual(`${RESET_TOKEN_NOT_FOUND}] Unable to find valid token`)
        })
    })
})
