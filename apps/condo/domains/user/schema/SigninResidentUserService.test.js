const { makeLoggedInAdminClient, makeClient, UUID_RE } = require('@open-condo/keystone/test.utils')

const { SIGNIN_RESIDENT_USER_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, createTestConfirmPhoneAction, ConfirmPhoneAction: ConfirmPhoneActionTestUtils } = require('@condo/domains/user/utils/testSchema')

describe('SigninResidentUserService', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
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
            const { data: { result: { user, token: authToken } } } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
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
            const { data: { result: { user, token: authToken } } } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(user.id).toMatch(UUID_RE)
            expect(user.name).toMatch(createdUser.name)
            expect(authToken).not.toHaveLength(0)
            const [updatedToken] = await ConfirmPhoneActionTestUtils.getAll(admin, { token: token.token })
            expect(updatedToken.completedAt).not.toBe(null)
        })

        it('can not register with expired phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true, expiresAt: new Date().toISOString() })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const { errors } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(errors).toMatchObject([{
                message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'signinResidentUser',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })

        it('can not register with used phone token', async () => {
            const admin = await makeLoggedInAdminClient()
            const [token] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true, completedAt: new Date().toISOString() })
            const client = await makeClient()
            const data = {
                dv: 1,
                sender: { dv: 1, fingerprint: 'tests' },
                token: token.token,
            }
            const { errors } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(errors).toMatchObject([{
                message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'signinResidentUser',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
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
            const { errors } = await client.mutate(SIGNIN_RESIDENT_USER_MUTATION, { data })
            expect(errors).toMatchObject([{
                message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                name: 'GQLError',
                path: ['result'],
                extensions: {
                    mutation: 'signinResidentUser',
                    variable: ['data', 'token'],
                    code: 'BAD_USER_INPUT',
                    type: 'TOKEN_NOT_FOUND',
                },
            }])
        })
    })
})
