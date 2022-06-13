const faker = require('faker')
const dayjs = require('dayjs')
const {
    makeLoggedInAdminClient,
    makeClient,
    waitFor,
} = require('@core/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowValidationFailureError,
} = require('@condo/domains/common/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithSupportUser,
    makeClientWithServiceUser,
    makeClientWithResidentUser,
} = require('@condo/domains/user/utils/testSchema')
const {
    createTestB2CApp,
    updateTestB2CApp,
    createTestB2CAppAccessRight,
    B2CAppProperty,
    createTestB2CAppProperty,
    updateTestB2CAppProperty,
    getFakeAddress,
} = require('@condo/domains/miniapp/utils/testSchema')
const {
    NO_APP_ERROR,
    RESTRICT_PROPERTY_APP_CHANGE_ERROR,
    INCORRECT_HOUSE_TYPE_ERROR,
    INCORRECT_ADDRESS_ERROR,
} = require('@condo/domains/miniapp/constants')

describe('B2CAppProperty', () => {
    let admin
    let support
    let app
    let permittedUser
    let user
    let anonymous
    let anotherPermittedUser
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        anonymous = await makeClient()
        user = await makeClientWithNewRegisteredAndLoggedInUser()

        permittedUser = await makeClientWithServiceUser()
        const [b2cApp] = await createTestB2CApp(admin)
        app = b2cApp
        await createTestB2CAppAccessRight(admin, permittedUser.user, app)

        anotherPermittedUser = await makeClientWithServiceUser()
        const [secondApp] = await createTestB2CApp(admin)
        await createTestB2CAppAccessRight(admin, anotherPermittedUser.user, secondApp)
    })
    describe('CRUD tests', () => {
        describe('Create', () => {
            test('Admin can', async () => {
                const [property] = await createTestB2CAppProperty(admin, app)
                expect(property).toBeDefined()
                expect(property).toHaveProperty(['app', 'id'], app.id)
            })
            test('Support can', async () => {
                const [property] = await createTestB2CAppProperty(admin, app)
                expect(property).toBeDefined()
                expect(property).toHaveProperty(['app', 'id'], app.id)
            })
            describe('User', () => {
                describe('Service user with access right', () => {
                    test('Can for permitted app', async () => {
                        const [property] = await createTestB2CAppProperty(permittedUser, app)
                        expect(property).toBeDefined()
                        expect(property).toHaveProperty(['app', 'id'], app.id)
                    })
                    test('Cannot for other app', async () => {
                        await expectToThrowAccessDeniedErrorToObj(async () => {
                            await createTestB2CAppProperty(anotherPermittedUser, app)
                        })
                    })
                })
                test('Cannot otherwise', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await createTestB2CAppProperty(user, app)
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestB2CAppProperty(anonymous, app)
                })
            })
        })
        describe('Update', () => {
            let property
            beforeEach(async () => {
                [property] = await createTestB2CAppProperty(admin, app)
            })
            test('Admin can update and soft-delete', async () => {
                const address = getFakeAddress()
                const [updatedProperty] = await updateTestB2CAppProperty(admin, property.id, { address })
                expect(updatedProperty).toHaveProperty('address', address.toLowerCase())
                const [deletedProperty] = await updateTestB2CAppProperty(admin, property.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedProperty).toHaveProperty('deletedAt')
                expect(deletedProperty.deletedAt).not.toBeNull()
            })
            test('Support can update and soft-delete', async () => {
                const address = getFakeAddress()
                const [updatedProperty] = await updateTestB2CAppProperty(support, property.id, { address })
                expect(updatedProperty).toHaveProperty('address', address.toLowerCase())
                const [deletedProperty] = await updateTestB2CAppProperty(support, property.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedProperty).toHaveProperty('deletedAt')
                expect(deletedProperty.deletedAt).not.toBeNull()
            })
            describe('User', () => {
                describe('With access right', () => {
                    test('Can update and soft-delete property linked to permitted app', async () => {
                        const address = getFakeAddress()
                        const loweredAddress = address.toLowerCase()
                        const [updatedProperty] = await updateTestB2CAppProperty(permittedUser, property.id, { address })
                        expect(updatedProperty).toHaveProperty('address', loweredAddress)
                        const [deletedProperty] = await updateTestB2CAppProperty(permittedUser, property.id, {
                            deletedAt: dayjs().toISOString(),
                        })
                        expect(deletedProperty).toHaveProperty('deletedAt')
                        expect(deletedProperty.deletedAt).not.toBeNull()
                    })
                    test('Cannot updated anything for property linked to non-permitted app', async () => {
                        await expectToThrowAccessDeniedErrorToObj(async () => {
                            await updateTestB2CAppProperty(anotherPermittedUser, property.id, {})
                        })
                    })
                })
                test('Cannot update otherwise', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestB2CAppProperty(user, property.id, {})
                    })
                })
            })
        })
        describe('Read', () => {
            let property
            beforeAll(async () => {
                [property] = await createTestB2CAppProperty(admin, app)
            })
            test('Admin can', async () => {
                const anotherAdmin = await makeLoggedInAdminClient()
                const properties = await B2CAppProperty.getAll(anotherAdmin, { id: property.id })
                expect(properties).toBeDefined()
                expect(properties).toHaveLength(1)
                expect(properties[0]).toHaveProperty('id', property.id)
            })
            test('Support can', async () => {
                const properties = await B2CAppProperty.getAll(support, { id: property.id })
                expect(properties).toBeDefined()
                expect(properties).toHaveLength(1)
                expect(properties[0]).toHaveProperty('id', property.id)
            })
            describe('User', () => {
                describe('With access right', () => {
                    test('To linked B2C app - can', async () => {
                        const properties = await B2CAppProperty.getAll(permittedUser, { id: property.id })
                        expect(properties).toBeDefined()
                        expect(properties).toHaveLength(1)
                        expect(properties[0]).toHaveProperty('id', property.id)
                    })
                    test('To other app - cannot', async () => {
                        const properties = await B2CAppProperty.getAll(anotherPermittedUser, { id: property.id })
                        expect(properties).toBeDefined()
                        expect(properties).toHaveLength(0)
                    })
                })
                test('With type RESIDENT - can', async () => {
                    const resident = await makeClientWithResidentUser()
                    const properties = await B2CAppProperty.getAll(resident, { id: property.id })
                    expect(properties).toBeDefined()
                    expect(properties).toHaveLength(1)
                    expect(properties[0]).toHaveProperty('id', property.id)
                })
                test('Otherwise cannot', async () => {
                    const properties = await B2CAppProperty.getAll(user, { id: property.id })
                    expect(properties).toBeDefined()
                    expect(properties).toHaveLength(0)
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await B2CAppProperty.getAll(anonymous, {})
                })
            })
        })
        describe('Delete', () => {
            let property
            let resident
            beforeAll(async () => {
                [property] = await createTestB2CAppProperty(admin, app)
                resident = await makeClientWithResidentUser()
            })
            test('Nobody can', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(admin, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(support, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(permittedUser, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(anotherPermittedUser, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(user, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(resident, property.id)
                })
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2CAppProperty.delete(anonymous, property.id)
                })
            })
        })
    })
    describe('Validation tests', () => {
        test('Service account cannot create property linked to non-permitted app or change link to another app', async () => {
            const [secondApp] = await createTestB2CApp(admin)
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await createTestB2CAppProperty(permittedUser, secondApp)
            })
            const [property] = await createTestB2CAppProperty(permittedUser, app)
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await updateTestB2CAppProperty(permittedUser, property.id, {
                    app: { connect: { id: secondApp.id } },
                })
            })
        })
        test('Must contains app link on creation', async () => {
            const testAppMock = { id: faker.datatype.uuid() }
            await expectToThrowValidationFailureError(async () => {
                await createTestB2CAppProperty(admin, testAppMock, {
                    app: null,
                })
            }, NO_APP_ERROR)
        })
        describe('Must auto-delete',  () => {
            test('On removing from app\'s properties list', async () => {
                const [newApp] = await createTestB2CApp(admin)
                const [property] = await createTestB2CAppProperty(admin, newApp)
                await updateTestB2CApp(admin, newApp.id, {
                    properties: { disconnect: { id: property.id } },
                })

                await waitFor(async () => {
                    const properties = await B2CAppProperty.getAll(admin, {
                        id: property.id,
                    })
                    expect(properties).toHaveLength(0)
                })
            })
            test('On removing link to app from property', async () => {
                const [property] = await createTestB2CAppProperty(admin, app)
                const [updatedProperty] = await updateTestB2CAppProperty(admin, property.id, {
                    app: { disconnectAll: true },
                })
                expect(updatedProperty).toBeDefined()
                expect(updatedProperty).toHaveProperty('deletedAt')
                expect(updatedProperty.deletedAt).not.toBeNull()
            })
        })
        describe('Cannot change app field, except setting it null for deletion',  () => {
            test('From property itself', async () => {
                const [secondApp] = await createTestB2CApp(admin)
                const [property] = await createTestB2CAppProperty(admin, secondApp)
                await expectToThrowValidationFailureError(async () => {
                    await updateTestB2CAppProperty(admin, property.id, {
                        app: { connect: { id: secondApp.id } },
                    })
                }, RESTRICT_PROPERTY_APP_CHANGE_ERROR)
            })
            describe('From app "properties" field',  () => {
                test('On app create', async () => {
                    const [property] = await createTestB2CAppProperty(admin, app)
                    await expectToThrowValidationFailureError(async () => {
                        await createTestB2CApp(admin, {
                            properties: { connect: { id: property.id } },
                        })
                    }, RESTRICT_PROPERTY_APP_CHANGE_ERROR)
                })
                test('On app update', async () => {
                    const [property] = await createTestB2CAppProperty(admin, app)
                    const [secondApp] = await createTestB2CApp(admin)
                    await expectToThrowValidationFailureError(async () => {
                        await updateTestB2CApp(admin, secondApp.id, {
                            properties: { connect: { id: property.id } },
                        })
                    }, RESTRICT_PROPERTY_APP_CHANGE_ERROR)
                })
            })
        })
        describe('Should validate address and throw error',  () => {
            test('If house type is not supported', async () => {
                await expectToThrowValidationFailureError(async () => {
                    await createTestB2CAppProperty(admin, app, {}, true, false)
                }, INCORRECT_HOUSE_TYPE_ERROR)
            })
            test('If address suggestion don\'t match input address', async () => {
                await expectToThrowValidationFailureError(async () => {
                    await createTestB2CAppProperty(admin, app, {}, false, true)
                }, INCORRECT_ADDRESS_ERROR)
            })
        })
    })
})
