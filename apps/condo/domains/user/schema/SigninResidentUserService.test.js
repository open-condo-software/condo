const { makeLoggedInAdminClient, makeClient, UUID_RE } = require('@core/keystone/test.utils')
const { SIGNIN_RESIDENT_USER_MUTATION } = require('@condo/domains/user/gql')
const {
    createTestUser,
    createTestConfirmPhoneAction,
    ConfirmPhoneAction: ConfirmPhoneActionTestUtils,
} = require('@condo/domains/user/utils/testSchema')
const { CONFIRM_PHONE_ACTION_EXPIRED } = require('@condo/domains/user/constants/errors')

describe('SigninResidentUserService', () => {
    describe('Anonymous', () => {
        it('can register with confirmed phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const {
                data: {
                    result: { user, token: authToken },
                },
            } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(user.id).toMatch(UUID_RE)
            expect(user.name).toBe(null)
            expect(authToken).not.toHaveLength(0)
            const [updatedToken] = await ConfirmPhoneActionTestUtils.getAll(admin, { token: token.token })
            expect(updatedToken.completedAt).not.toBe(null)
        })
        it('can signin with confirmed phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
            const [createdUser] = await createTestUser(admin, { phone: token.phone, type: 'resident', isPhoneVerified: true })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const {
                data: {
                    result: { user, token: authToken },
                },
            } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(user.id).toMatch(UUID_RE)
            expect(user.name).toMatch(createdUser.name)
            expect(authToken).not.toHaveLength(0)
            const [updatedToken] = await ConfirmPhoneActionTestUtils.getAll(admin, { token: token.token })
            expect(updatedToken.completedAt).not.toBe(null)
        })
        it('can not register with expired phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, {
                isPhoneVerified: true,
                expiresAt: new Date().toISOString(),
            })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const {
                errors: [error],
            } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(error.message).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
        })
        it('can not register with used phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, {
                isPhoneVerified: true,
                completedAt: new Date().toISOString(),
            })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const {
                errors: [error],
            } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(error.message).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
        })
        it('can not register with not confirmed phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: false })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const {
                errors: [error],
            } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(error.message).toContain(CONFIRM_PHONE_ACTION_EXPIRED)
        })
    })
})
