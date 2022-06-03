
const { makeLoggedInAdminClient, makeClient, makeLoggedInClient } = require('@core/keystone/test.utils')
const { CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, createTestConfirmPhoneAction, UserAdmin, makeClientWithResidentUser, makeClientWithStaffUser } = require('@condo/domains/user/utils/testSchema')
const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')
const { changePhoneNumberResidentUserByTestClient } = require('../utils/testSchema')
const { expectToThrowAccessDeniedErrorToResult, expectToThrowAuthenticationErrorToResult } = require('@condo/domains/common/utils/testSchema')

describe('ChangePhoneNumberResidentUserService', () => {
    describe('Anonymous', () => {
        it('can not change phone with token', async () => {
            const client = await makeClient()
            const admin = await makeLoggedInAdminClient()
            const [{ token }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
            await createTestUser(admin, { phone: token.phone, type: RESIDENT })
            await expectToThrowAuthenticationErrorToResult(async () => {
                await changePhoneNumberResidentUserByTestClient(client, { token })
            })
        })
    })

    describe('When current phone is confirmed', () => {
        describe('Resident', () => {
            it('can change phone with token', async () => {
                const admin = await makeLoggedInAdminClient()
                const [{ token, phone }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const client = await makeClientWithResidentUser({ type: RESIDENT, isPhoneVerified: true })
                const [result] = await changePhoneNumberResidentUserByTestClient(client, { token })
                expect(result).toEqual({ 'status': 'ok' })
                const updatedUser = await UserAdmin.getOne(admin, { phone })
                expect(updatedUser).toMatchObject({
                    id: client.user.id,
                    phone: phone,
                    isPhoneVerified: true,
                })
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
                const { errors } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(errors).toMatchObject([{
                    message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                    name: 'GQLError',
                    path: ['result'],
                    extensions: {
                        mutation: 'changePhoneNumberResidentUser',
                        message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                        variable: ['data', 'token'],
                        code: 'BAD_USER_INPUT',
                        type: 'NOT_FOUND',
                    },
                }])
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
                const { errors } = await client.mutate(CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION, { data })
                expect(errors).toMatchObject([{
                    message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                    name: 'GQLError',
                    path: ['result'],
                    extensions: {
                        mutation: 'changePhoneNumberResidentUser',
                        message: 'Unable to find a non-expired confirm phone action, that corresponds to provided token',
                        variable: ['data', 'token'],
                        code: 'BAD_USER_INPUT',
                        type: 'NOT_FOUND',
                    },
                }])
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
                const client = await makeClientWithStaffUser({ isPhoneVerified: false })
                const admin = await makeLoggedInAdminClient()
                const [{ token }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                await expectToThrowAccessDeniedErrorToResult(async () => {
                    await changePhoneNumberResidentUserByTestClient(client, { token })
                })
            })
        })
    })
})
