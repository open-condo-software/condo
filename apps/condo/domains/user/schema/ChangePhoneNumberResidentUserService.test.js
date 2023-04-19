
const faker = require('faker')

const { makeLoggedInAdminClient, makeClient, makeLoggedInClient, expectToThrowInternalError, catchErrorFrom } = require('@open-condo/keystone/test.utils')
const { expectToThrowAccessDeniedErrorToResult, expectToThrowAuthenticationErrorToResult } = require('@open-condo/keystone/test.utils')

const { STAFF, RESIDENT } = require('@condo/domains/user/constants/common')
const { SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { CHANGE_PHONE_NUMBER_RESIDENT_USER_MUTATION } = require('@condo/domains/user/gql')
const { createTestUser, createTestConfirmPhoneAction, UserAdmin, makeClientWithResidentUser, makeClientWithStaffUser, createTestPhone, createTestUserExternalIdentity } = require('@condo/domains/user/utils/testSchema')

const { changePhoneNumberResidentUserByTestClient } = require('../utils/testSchema')


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
            it('can change phone with token if user with same phone and staff type exists', async () => {
                const admin = await makeLoggedInAdminClient()
                const [{ token, phone }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const client = await makeClientWithResidentUser({ type: RESIDENT, isPhoneVerified: true })
                await createTestUser(admin, { phone: phone, type: STAFF })

                const [result] = await changePhoneNumberResidentUserByTestClient(client, { token })
                expect(result).toEqual({ 'status': 'ok' })
                const updatedUser = await UserAdmin.getOne(admin, { phone, type: RESIDENT })
                expect(updatedUser).toMatchObject({
                    id: client.user.id,
                    phone: phone,
                    isPhoneVerified: true,
                })
            })
            it('can not change phone with token if user with same phone and resident type exists', async () => {
                const admin = await makeLoggedInAdminClient()
                const [{ token, phone }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const client = await makeClientWithResidentUser({ type: RESIDENT, isPhoneVerified: true })
                await createTestUser(admin, { phone: phone, type: RESIDENT })

                await expectToThrowInternalError(async () => {
                    await changePhoneNumberResidentUserByTestClient(client, { token })
                }, '[error] Update User internal error', 'result')
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
            it('can not change phone with connected external identity pointed to another phone', async () => {
                const admin = await makeLoggedInAdminClient()
                const anotherPhone = createTestPhone()
                const [{ token, phone }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const client = await makeClientWithResidentUser({ type: RESIDENT, isPhoneVerified: true })

                // create user external identity pointed to another phone
                await createTestUserExternalIdentity(admin, {
                    user: { connect: { id: client.user.id } },
                    identityId: faker.random.alphaNumeric(8),
                    identityType: SBER_ID_IDP_TYPE,
                    meta: {
                        dv: 1, city: faker.address.city(), county: faker.address.county(), phoneNumber: anotherPhone,
                    },
                })

                await catchErrorFrom(async () => {
                    await changePhoneNumberResidentUserByTestClient(client, { token })
                }, ({ errors }) => {
                    expect(errors).toMatchObject([{
                        message: 'Unable to change phone number since user has external identity and phone number are different',
                        name: 'GQLError',
                        path: ['result'],
                        extensions: {
                            code: 'BAD_USER_INPUT',
                            type: 'WRONG_VALUE',
                            mutation: 'changePhoneNumberResidentUser',
                            message: 'Unable to change phone number since user has external identity and phone number are different',
                            variable: ['data', 'token'],
                        },
                    }])
                })
            })
            it('can change phone with connected external identity pointed to another phone if remove flag provided', async () => {
                const admin = await makeLoggedInAdminClient()
                const anotherPhone = createTestPhone()
                const [{ token, phone }] = await createTestConfirmPhoneAction(admin, { isPhoneVerified: true })
                const client = await makeClientWithResidentUser({ type: RESIDENT, isPhoneVerified: true })

                // create user external identity pointed to another phone
                await createTestUserExternalIdentity(admin, {
                    user: { connect: { id: client.user.id } },
                    identityId: faker.random.alphaNumeric(8),
                    identityType: SBER_ID_IDP_TYPE,
                    meta: {
                        dv: 1, city: faker.address.city(), county: faker.address.county(), phoneNumber: anotherPhone,
                    },
                })
                const [result] = await changePhoneNumberResidentUserByTestClient(client,
                    { token, removeUserExternalIdentitiesIfPhoneDifferent: true },
                )
                expect(result).toEqual({ 'status': 'ok' })
                const updatedUser = await UserAdmin.getOne(admin, { phone })
                expect(updatedUser).toMatchObject({
                    id: client.user.id,
                    phone: phone,
                    isPhoneVerified: true,
                })
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
