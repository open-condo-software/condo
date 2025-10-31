/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { STAFF, RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const {
    registerNewUser,
    User,
    createTestConfirmPhoneAction,
    ConfirmPhoneAction,
    updateTestUser,
    resetUserByTestClient,
    createTestConfirmEmailAction,
} = require('@condo/domains/user/utils/testSchema')

const { validateUserCredentials } = require('./auth')


setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp', 'OIDCMiddleware'] })

describe('function "validateUserCredentials"', () => {
    let adminClient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('Errors', () => {
        test('should throw error if no userIdentity', async () => {
            const anonymous = await makeClient()
            const [, userAttrs] = await registerNewUser(anonymous)
            await expect(async () => {
                await validateUserCredentials(null, { password: userAttrs.password })
            }).rejects.toThrow('You must provide userIdentity')
        })

        test('should throw error if no authFactors', async () => {
            const anonymous = await makeClient()
            const [, userAttrs] = await registerNewUser(anonymous)
            await expect(async () => {
                await validateUserCredentials({ phone: userAttrs.phone, userType: STAFF }, null)
            }).rejects.toThrow('You must provide authFactors')
        })

        test('should throw error if no user type', async () => {
            const anonymous = await makeClient()
            const [, userAttrs] = await registerNewUser(anonymous)
            await expect(async () => {
                await validateUserCredentials({ phone: userAttrs.phone }, { password: userAttrs.password })
            }).rejects.toThrow('You must provide a user type')
        })

    })

    describe('Basic logic', () => {
        describe('should return "success: false" if user not found', () => {
            test('if no email and phone', async () => {
                const anonymous = await makeClient()
                const [, userAttrs] = await registerNewUser(anonymous)
                const result = await validateUserCredentials({ userType: STAFF }, { password: userAttrs.password })
                expect(result.success).toBeFalsy()
            })

            test('if user deleted', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                const resultBeforeDeletion = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: userAttrs.password })
                expect(resultBeforeDeletion.success).toBeTruthy()
                expect(resultBeforeDeletion.user.id).toBe(registeredUser.id)

                await User.softDelete(adminClient, registeredUser.id)

                const resultAfterDeletion = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: userAttrs.password })
                expect(resultAfterDeletion.success).toBeFalsy()
            })

            test('if user was reset', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await resetUserByTestClient(adminClient, { user: { id: registeredUser.id } })

                const resultAfterDeletion = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: userAttrs.password })
                expect(resultAfterDeletion.success).toBeFalsy()
            })

            test('if phone is wrong', async () => {
                const result = await validateUserCredentials({ phone: 'wrong-phone', userType: STAFF }, { password: 'password' })
                expect(result.success).toBeFalsy()
            })

            test('if email is wrong', async () => {
                const result = await validateUserCredentials({ email: 'wrong-email', userType: STAFF }, { password: 'password' })
                expect(result.success).toBeFalsy()
            })

            test('if email is not verified', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                const result = await validateUserCredentials({ email: registeredUser.email, userType: registeredUser.type }, { password: userAttrs.password })
                expect(result.success).toBeFalsy()
            })

            test('if email or phone are wrong', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                const resultWithWrongEmail = await validateUserCredentials({ phone: userAttrs.phone, email: 'wrong-email', userType: registeredUser.type }, { password: userAttrs.password })
                expect(resultWithWrongEmail.success).toBeFalsy()

                const resultWithWrongPhone = await validateUserCredentials({ phone: 'wrong-phone', email: userAttrs.email, userType: registeredUser.type }, { password: userAttrs.password })
                expect(resultWithWrongPhone.success).toBeFalsy()
            })

            test('if userType is wrong', async () => {
                const anonymous = await makeClient()
                const [registeredStaffUser, userAttrs] = await registerNewUser(anonymous)

                const resultWithStaff = await validateUserCredentials({ phone: userAttrs.phone, userType: STAFF }, { password: userAttrs.password })
                expect(resultWithStaff.success).toBeTruthy()
                expect(resultWithStaff.user.id).toBe(registeredStaffUser.id)

                const resultWithResident = await validateUserCredentials({ phone: userAttrs.phone, userType: RESIDENT }, { password: userAttrs.password })
                expect(resultWithResident.success).toBeFalsy()

                const resultWithService = await validateUserCredentials({ phone: userAttrs.phone, userType: SERVICE }, { password: userAttrs.password })
                expect(resultWithService.success).toBeFalsy()
            })

            test('if confirmPhoneToken is wrong', async () => {
                const resultWithService = await validateUserCredentials({ userType: STAFF }, { confirmPhoneToken: faker.datatype.uuid() })
                expect(resultWithService.success).toBeFalsy()
            })

            test('if confirmEmailToken is wrong', async () => {
                const resultWithService = await validateUserCredentials({ userType: STAFF }, { confirmEmailToken: faker.datatype.uuid() })
                expect(resultWithService.success).toBeFalsy()
            })

            test('if confirmEmailToken or confirmPhoneToken is wrong', async () => {
                const resultWithService = await validateUserCredentials(
                    { userType: STAFF },
                    { confirmEmailToken: faker.datatype.uuid(), confirmPhoneToken: faker.datatype.uuid() }
                )
                expect(resultWithService.success).toBeFalsy()
            })

            test('if confirmEmailToken from other email', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                const anonymous2 = await makeClient()
                const [registeredUser2, userAttrs2] = await registerNewUser(anonymous2)
                await updateTestUser(adminClient, registeredUser2.id, { isEmailVerified: true })

                const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                    email: userAttrs.email, isEmailVerified: true, expiresAt: new Date().toISOString(),
                })

                const resultWithOtherEmail = await validateUserCredentials(
                    { email: userAttrs2.email, userType: registeredUser.type },
                    { confirmEmailToken: token }
                )
                expect(resultWithOtherEmail.success).toBeFalsy()
            })

            test('if confirmPhoneToken from other phone', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                const anonymous2 = await makeClient()
                const [, userAttrs2] = await registerNewUser(anonymous2)

                const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                    phone: userAttrs.phone, isPhoneVerified: true, expiresAt: new Date().toISOString(),
                })

                const resultWithOtherEmail = await validateUserCredentials(
                    { phone: userAttrs2.phone, userType: registeredUser.type },
                    { confirmPhoneToken: token }
                )
                expect(resultWithOtherEmail.success).toBeFalsy()
            })
        })

        describe('one-factor authentication', () => {
            test('should return "success: false" if user found and user password is null', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { password: null, isEmailVerified: true })

                const result1 = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: null })
                expect(result1.success).toBeFalsy()
                const result2 = await validateUserCredentials({ email: userAttrs.email, userType: registeredUser.type }, { password: null })
                expect(result2.success).toBeFalsy()
            })

            test('should return "success: false" if user found and user password is empty string', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { password: '', isEmailVerified: true })

                const result1 = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: '' })
                expect(result1.success).toBeFalsy()
                const result2 = await validateUserCredentials({ email: userAttrs.email, userType: registeredUser.type }, { password: '' })
                expect(result2.success).toBeFalsy()
            })

            test('should return "success: false" if user found and pass empty confirmPhoneToken', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { confirmPhoneToken: null })
                expect(result.success).toBeFalsy()
            })

            test('should return "success: false" if user found and pass empty confirmEmailToken', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                const result = await validateUserCredentials({ email: userAttrs.email, userType: registeredUser.type }, { confirmEmailToken: null })
                expect(result.success).toBeFalsy()
            })

            describe('should return "success: false" if user found but user not match', () => {
                test('if no pass password and confirmPhoneToken and confirmEmailToken', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                    const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, {})
                    expect(result.success).toBeFalsy()
                    expect(result._error.errorType).toBe('NOT_ENOUGH_AUTH_FACTORS')
                    expect(result._error.authChecks).toEqual({
                        password: 'skip',
                        confirmPhoneToken: 'skip',
                        confirmEmailToken: 'skip',
                    })
                    expect(result._error.is2FAEnabled).toBeFalsy()
                })

                test('if password invalid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: faker.random.alphaNumeric(16) }
                    )
                    expect(result.success).toBeFalsy()
                })

                describe('confirmPhoneToken cases', () => {
                    test('if confirmPhoneToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: faker.datatype.uuid() }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmPhoneToken is expired', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: true, expiresAt: new Date().toISOString(),
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmPhoneToken is used', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: true, completedAt: new Date().toISOString(),
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmPhoneToken is not confirmed', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: false,
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password invalid and confirmPhoneToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, { phone: userAttrs.phone, isPhoneVerified: true })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token, password: faker.random.alphaNumeric(16) }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password valid and confirmPhoneToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: faker.datatype.uuid(), password: userAttrs.password }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password invalid and confirmPhoneToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: faker.datatype.uuid(), password: faker.random.alphaNumeric(16) }
                        )
                        expect(result.success).toBeFalsy()
                    })
                })

                describe('confirmEmailToken cases', () => {
                    test('if confirmEmailToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: faker.datatype.uuid() }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmEmailToken is expired', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: true, expiresAt: new Date().toISOString(),
                        })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmEmailToken is used', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: true, completedAt: new Date().toISOString(),
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmEmailToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if confirmEmailToken is not confirmed', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: false,
                        })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: token }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password invalid and confirmEmailToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, { email: userAttrs.email, isEmailVerified: true })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: token, password: faker.random.alphaNumeric(16) }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password valid and confirmEmailToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: faker.datatype.uuid(), password: userAttrs.password }
                        )
                        expect(result.success).toBeFalsy()
                    })

                    test('if password invalid and confirmEmailToken invalid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: faker.datatype.uuid(), password: faker.random.alphaNumeric(16) }
                        )
                        expect(result.success).toBeFalsy()
                    })
                })

                test('if at least one of the auth factors is invalid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                    const [{ token: confirmPhoneToken }] = await createTestConfirmPhoneAction(adminClient, { phone: userAttrs.phone, isPhoneVerified: true })
                    const [{ token: confirmEmailToken }] = await createTestConfirmEmailAction(adminClient, { email: userAttrs.email, isEmailVerified: true })

                    const result1 = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { confirmEmailToken, confirmPhoneToken, password: faker.random.alphaNumeric(16) }
                    )
                    expect(result1.success).toBeFalsy()

                    const result2 = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { confirmEmailToken: faker.datatype.uuid(), confirmPhoneToken, password: userAttrs.password }
                    )
                    expect(result2.success).toBeFalsy()

                    const result3 = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { confirmEmailToken, confirmPhoneToken: faker.datatype.uuid(), password: userAttrs.password }
                    )
                    expect(result3.success).toBeFalsy()
                })

                test('if email and password valid but email not verified', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                    const result = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { password: userAttrs.password }
                    )
                    expect(result.success).toBeFalsy()
                })
            })

            describe('should return "success: true" if user found and user match', () => {
                test('if password valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password }
                    )
                    expect(result.success).toBeTruthy()
                    expect(result.user.id).toBe(registeredUser.id)
                })

                describe('confirmPhoneToken cases', () => {
                    test('if confirmPhoneToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })

                    test('if pass confirmPhoneToken only and it is valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { userType: registeredUser.type },
                            { confirmPhoneToken: token }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })

                    test('if password valid and confirmPhoneToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                        const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                            phone: userAttrs.phone, isPhoneVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { phone: userAttrs.phone, userType: registeredUser.type },
                            { confirmPhoneToken: token, password: userAttrs.password }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })
                })

                describe('confirmEmailToken cases', () => {
                    test('if confirmEmailToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: token }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })

                    test('if pass confirmEmailToken only and it is valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { userType: registeredUser.type },
                            { confirmEmailToken: token }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })

                    test('if password valid and confirmEmailToken valid', async () => {
                        const anonymous = await makeClient()
                        const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                        await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                        const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                            email: userAttrs.email, isEmailVerified: true,
                        })

                        const result = await validateUserCredentials(
                            { email: userAttrs.email, userType: registeredUser.type },
                            { confirmEmailToken: token, password: userAttrs.password }
                        )
                        expect(result.success).toBeTruthy()
                        expect(result.user.id).toBe(registeredUser.id)
                    })
                })

                test('if all auth factors are valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                    const [{ token: confirmEmailToken }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const [{ token: confirmPhoneToken }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })

                    const result = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { confirmEmailToken, confirmPhoneToken, password: userAttrs.password }
                    )
                    expect(result.success).toBeTruthy()
                    expect(result.user.id).toBe(registeredUser.id)
                })

                test('if email valid and verified and password valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, { isEmailVerified: true })

                    const result = await validateUserCredentials({ email: userAttrs.email, userType: registeredUser.type }, { password: userAttrs.password })
                    expect(result.success).toBeTruthy()
                })
            })
        })

        describe('two-factor authentication', () => {
            describe('should return "success: false" if there are not enough factors for authentication', () => {
                test('if only the password is passed and it is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password }
                    )

                    expect(result.success).toBeFalsy()
                    expect(result._error.errorType).toBe('NOT_ENOUGH_AUTH_FACTORS')
                    expect(result._error.authChecks).toEqual({
                        password: 'success',
                        confirmPhoneToken: 'skip',
                        confirmEmailToken: 'skip',
                    })
                    expect(result._error.is2FAEnabled).toBeTruthy()
                })

                test('if only the confirmPhoneToken is passed and it is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })

                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { confirmPhoneToken: token }
                    )

                    expect(result.success).toBeFalsy()
                    expect(result._error.errorType).toBe('NOT_ENOUGH_AUTH_FACTORS')
                    expect(result._error.authChecks).toEqual({
                        password: 'skip',
                        confirmPhoneToken: 'success',
                        confirmEmailToken: 'skip',
                    })
                    expect(result._error.is2FAEnabled).toBeTruthy()
                })

                test('if only the confirmEmailToken is passed and it is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })

                    const result = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { confirmEmailToken: token }
                    )

                    expect(result.success).toBeFalsy()
                    expect(result._error.errorType).toBe('NOT_ENOUGH_AUTH_FACTORS')
                    expect(result._error.authChecks).toEqual({
                        password: 'skip',
                        confirmPhoneToken: 'skip',
                        confirmEmailToken: 'success',
                    })
                    expect(result._error.is2FAEnabled).toBeTruthy()
                })

                test('if password and confirmPhoneToken is valid, but confirmEmailToken is not valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password, confirmPhoneToken: token, confirmEmailToken: faker.datatype.uuid() }
                    )
                    expect(result.success).toBeFalsy()
                })

                test('if password and confirmEmailToken is valid, but confirmPhoneToken is not valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password, confirmPhoneToken: faker.datatype.uuid(), confirmEmailToken: token }
                    )
                    expect(result.success).toBeFalsy()
                })

                test('if confirmPhoneToken and confirmEmailToken is valid, but password is not valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token: confirmPhoneToken }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })
                    const [{ token: confirmEmailToken }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: faker.random.alphaNumeric(16), confirmPhoneToken, confirmEmailToken }
                    )
                    expect(result.success).toBeFalsy()
                })
            })

            describe('should return "success: true" if there are enough authentication factors', () => {
                test('if password and confirmPhoneToken is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password, confirmPhoneToken: token }
                    )
                    expect(result.success).toBeTruthy()
                })

                test('if password and confirmEmailToken is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { email: userAttrs.email, userType: registeredUser.type },
                        { password: userAttrs.password, confirmEmailToken: token }
                    )
                    expect(result.success).toBeTruthy()
                })

                test('if confirmPhoneToken and confirmEmailToken is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token: confirmPhoneToken }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })
                    const [{ token: confirmEmailToken }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { userType: registeredUser.type },
                        { confirmPhoneToken, confirmEmailToken }
                    )
                    expect(result.success).toBeTruthy()
                })

                test('if password and confirmPhoneToken and confirmEmailToken is valid', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                    await updateTestUser(adminClient, registeredUser.id, {
                        isEmailVerified: true,
                        isTwoFactorAuthenticationEnabled: true,
                    })

                    const [{ token: confirmPhoneToken }] = await createTestConfirmPhoneAction(adminClient, {
                        phone: userAttrs.phone, isPhoneVerified: true,
                    })
                    const [{ token: confirmEmailToken }] = await createTestConfirmEmailAction(adminClient, {
                        email: userAttrs.email, isEmailVerified: true,
                    })
                    const result = await validateUserCredentials(
                        { phone: userAttrs.phone, userType: registeredUser.type },
                        { password: userAttrs.password, confirmPhoneToken, confirmEmailToken }
                    )
                    expect(result.success).toBeTruthy()
                })
            })
        })

        test('correctly separates users with the same phone and email but different types', async () => {
            const [registeredResidentUser, residentUserAttrs] = await registerNewUser(await makeClient())
            await updateTestUser(adminClient, registeredResidentUser.id, { type: RESIDENT, isEmailVerified: true })
            const resultWithResident = await validateUserCredentials({ phone: residentUserAttrs.phone, email: residentUserAttrs.email, userType: RESIDENT }, { password: residentUserAttrs.password })
            expect(resultWithResident.success).toBeTruthy()
            expect(resultWithResident.user.id).toBe(registeredResidentUser.id)

            const [registeredServiceUser, serviceUserAttrs] = await registerNewUser(await makeClient(), { phone: residentUserAttrs.phone, email: residentUserAttrs.email })
            await updateTestUser(adminClient, registeredServiceUser.id, { type: SERVICE, isEmailVerified: true })
            const resultWithService = await validateUserCredentials({ phone: serviceUserAttrs.phone, email: serviceUserAttrs.email, userType: SERVICE }, { password: serviceUserAttrs.password })
            expect(resultWithService.success).toBeTruthy()
            expect(resultWithService.user.id).toBe(registeredServiceUser.id)

            const [registeredStaffUser, staffUserAttrs] = await registerNewUser(await makeClient(), { phone: residentUserAttrs.phone, email: residentUserAttrs.email })
            await updateTestUser(adminClient, registeredStaffUser.id, { isEmailVerified: true })
            const resultWithStaff = await validateUserCredentials({ phone: staffUserAttrs.phone, email: staffUserAttrs.email, userType: STAFF }, { password: staffUserAttrs.password })
            expect(resultWithStaff.success).toBeTruthy()
            expect(resultWithStaff.user.id).toBe(registeredStaffUser.id)
        })

        test('confirmPhoneAction should not be marked as used after validation', async () => {
            const anonymous = await makeClient()
            const [registeredUser, userAttrs] = await registerNewUser(anonymous)

            const [{ token }] = await createTestConfirmPhoneAction(adminClient, {
                phone: userAttrs.phone, isPhoneVerified: true,
            })

            const result = await validateUserCredentials(
                { phone: userAttrs.phone, userType: registeredUser.type },
                { confirmPhoneToken: token }
            )
            expect(result.success).toBeTruthy()
            expect(result.user.id).toBe(registeredUser.id)

            const confirmPhoneAction = await ConfirmPhoneAction.getOne(adminClient, { token })
            expect(confirmPhoneAction.completedAt).toBeNull()
        })

        test('should return user data, confirmPhoneAction data and validation results after successful validation', async () => {
            const anonymous = await makeClient()
            const [registeredUser, userAttrs] = await registerNewUser(anonymous)

            const [confirmPhoneAction] = await createTestConfirmPhoneAction(adminClient, {
                phone: userAttrs.phone, isPhoneVerified: true,
            })

            const result = await validateUserCredentials(
                { phone: userAttrs.phone, userType: registeredUser.type },
                { confirmPhoneToken: confirmPhoneAction.token }
            )
            expect(result.success).toBeTruthy()
            expect(result.user.id).toBe(registeredUser.id)
            expect(result.confirmPhoneAction.id).toBe(confirmPhoneAction.id)
        })
    })
})
