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
    updateTestUser, resetUserByTestClient,
} = require('@condo/domains/user/utils/testSchema')

const { validateUserCredentials } = require('./auth')

const { generateSimulatedToken } = require('../tokens')


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

        test('should throw error if pass authFactors.confirmEmailToken', async () => {
            const anonymous = await makeClient()
            const [, userAttrs] = await registerNewUser(anonymous)
            await expect(async () => {
                await validateUserCredentials({ phone: userAttrs.phone, userType: STAFF }, { confirmEmailToken: generateSimulatedToken() })
            }).rejects.toThrow('confirmEmailToken is not supported yet')
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

            test('if email or phone are wrong', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)

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
        })

        describe('one-factor authentication', () => {
            test('should return "success: false" if user found and user password is null', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { password: null })

                const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: null })
                expect(result.success).toBeFalsy()
            })

            test('should return "success: false" if user found and user password is empty string', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)
                await updateTestUser(adminClient, registeredUser.id, { password: '' })

                const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { password: '' })
                expect(result.success).toBeFalsy()
            })

            test('should return "success: false" if user found and pass empty confirmPhoneToken', async () => {
                const anonymous = await makeClient()
                const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, { confirmPhoneToken: null })
                expect(result.success).toBeFalsy()
            })

            describe('should return "success: false" if user found but user not match', () => {
                test('if no pass password and confirmPhoneToken', async () => {
                    const anonymous = await makeClient()
                    const [registeredUser, userAttrs] = await registerNewUser(anonymous)

                    const result = await validateUserCredentials({ phone: userAttrs.phone, userType: registeredUser.type }, {})
                    expect(result.success).toBeFalsy()
                    expect(result._error.errorType).toBe('NOT_ENOUGH_AUTH_FACTORS')
                    expect(result._error.authChecks).toEqual({
                        password: 'skip',
                        confirmPhoneToken: 'skip',
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
        })

        // describe('two-factor authentication')

        test('correctly separates users with the same phone and email but different types', async () => {
            const [registeredResidentUser, residentUserAttrs] = await registerNewUser(await makeClient())
            await updateTestUser(adminClient, registeredResidentUser.id, { type: RESIDENT })
            const resultWithResident = await validateUserCredentials({ phone: residentUserAttrs.phone, email: residentUserAttrs.email, userType: RESIDENT }, { password: residentUserAttrs.password })
            expect(resultWithResident.success).toBeTruthy()
            expect(resultWithResident.user.id).toBe(registeredResidentUser.id)

            const [registeredServiceUser, serviceUserAttrs] = await registerNewUser(await makeClient(), { phone: residentUserAttrs.phone, email: residentUserAttrs.email })
            await updateTestUser(adminClient, registeredServiceUser.id, { type: SERVICE })
            const resultWithService = await validateUserCredentials({ phone: serviceUserAttrs.phone, email: serviceUserAttrs.email, userType: SERVICE }, { password: serviceUserAttrs.password })
            expect(resultWithService.success).toBeTruthy()
            expect(resultWithService.user.id).toBe(registeredServiceUser.id)

            const [registeredStaffUser, staffUserAttrs] = await registerNewUser(await makeClient(), { phone: residentUserAttrs.phone, email: residentUserAttrs.email })
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
