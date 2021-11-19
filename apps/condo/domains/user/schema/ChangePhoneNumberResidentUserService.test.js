
const { makeLoggedInAdminClient, makeClient, makeLoggedInClient } = require('@core/keystone/test.utils')
const { CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, createTestConfirmPhoneAction, User: UserTestUtils } = require('@condo/domains/user/utils/testSchema')
const {
    CONFIRM_PHONE_ACTION_EXPIRED,
} = require('@condo/domains/user/constants/errors')
const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')

describe('ChangePhoneNumberResidentUserService', () => {
    describe('Anonymous', () => {
        it('can not change phone with token', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
            await createTestUser(admin, { phone: token.phone, type: RESIDENT })
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
            expect(error).toMatchObject({
                name: 'AuthenticationError',
                message: 'No or incorrect authentication credentials',
                path: [ 'result' ],
            })
        })
    })

    describe('When current phone is confirmed', () => {
        describe('Resident', () => {
            it('can change phone with token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const [createdUser, userAttrs] = await createTestUser(admin, { type: RESIDENT, isPhoneVerified: true })
                const client = await makeLoggedInClient(userAttrs)
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { data: { result: { status } } } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(status).toBe('ok')
                const [updatedUser] = await UserTestUtils.getAll(admin, { phone: token.phone })
                expect(updatedUser.id).toEqual(createdUser.id)
            })
            it('can not change phone with expired token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true, expiresAt: new Date().toISOString() })
                const [, userAttrs] = await createTestUser(admin, { phone: token.phone, type: RESIDENT, isPhoneVerified: true })
                const client = await makeLoggedInClient(userAttrs)
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(error.message).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
            })
            it('can not change phone with used token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true, completedAt: new Date().toISOString() })
                const [, userAttrs] = await createTestUser(admin, { phone: token.phone, type: RESIDENT, isPhoneVerified: true })
                const client = await makeLoggedInClient(userAttrs)
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(error.message).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
            })
        })
        describe('Staff', () => {
            it('can not change phone with token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const [, userAttrs] = await createTestUser(admin, { phone: token.phone, type: STAFF, isPhoneVerified: true })
                const client = await makeLoggedInClient(userAttrs)
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(error.name).toEqual('AccessDeniedError')
            })
        })
    })

    describe('When current phone is not confirmed', () => {
        describe('Resident', () => {
            it('can not change phone with token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const [, userAttrs] = await createTestUser(admin, { phone: token.phone, type: RESIDENT, isPhoneVerified: false })
                const client = await makeLoggedInClient(userAttrs)
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(error.name).toEqual('AccessDeniedError')
            })
        })
        describe('Staff', () => {
            it('can not change phone with token', async () => {
                const client = await makeClient()
                const admin = await makeLoggedInAdminClient()
                const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                await createTestUser(admin, { phone: token.phone, type: STAFF, isPhoneVerified: false })
                const data = {
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'tests' },
                    token: token.token,
                }
                const { errors: [error] } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(error.name).toEqual('AuthenticationError')
            })
        })
    })
})
