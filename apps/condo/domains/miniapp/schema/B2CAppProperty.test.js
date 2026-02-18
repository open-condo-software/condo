const dayjs = require('dayjs')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    setFeatureFlag,
} = require('@open-condo/keystone/test.utils')

const { SUBSCRIPTIONS } = require('@condo/domains/common/constants/featureflags')
const {
    createTestB2CApp,
    createTestB2CAppAccessRight,
    B2CAppProperty,
    createTestB2CAppProperty,
    updateTestB2CAppProperty,
} = require('@condo/domains/miniapp/utils/testSchema')
const { MANAGING_COMPANY_TYPE } = require('@condo/domains/organization/constants/common')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { buildFakeAddressAndMeta } = require('@condo/domains/property/utils/testSchema/factories')
const { 
    createTestSubscriptionPlan, 
    createTestSubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')
const {
    makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithSupportUser,
    makeClientWithServiceUser,
    makeClientWithResidentUser,
} = require('@condo/domains/user/utils/testSchema')

describe('B2CAppProperty test', () => {
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
                const { address, addressMeta } = buildFakeAddressAndMeta(false)
                const [updatedProperty] = await updateTestB2CAppProperty(admin, property.id, { address, addressMeta })
                expect(updatedProperty).toHaveProperty('address', address)
                const [deletedProperty] = await updateTestB2CAppProperty(admin, property.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedProperty).toHaveProperty('deletedAt')
                expect(deletedProperty.deletedAt).not.toBeNull()
            })
            test('Support can update and soft-delete', async () => {
                const { address, addressMeta } = buildFakeAddressAndMeta(false)
                const [updatedProperty] = await updateTestB2CAppProperty(support, property.id, { address, addressMeta })
                expect(updatedProperty).toHaveProperty('address', address)
                const [deletedProperty] = await updateTestB2CAppProperty(support, property.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedProperty).toHaveProperty('deletedAt')
                expect(deletedProperty.deletedAt).not.toBeNull()
            })
            describe('User', () => {
                describe('With access right', () => {
                    test('Can update and soft-delete property linked to permitted app', async () => {
                        const { address, addressMeta } = buildFakeAddressAndMeta(false)
                        const [updatedProperty] = await updateTestB2CAppProperty(permittedUser, property.id, { address, addressMeta })
                        expect(updatedProperty).toHaveProperty('address', address)
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
                    await expectToThrowAccessDeniedErrorToObjects(async () => {
                        await B2CAppProperty.getAll(user, { id: property.id })
                    })
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
        })
    })

    describe('isAvailable field', () => {
        let prevSubscriptionsFlag
          
        beforeAll(() => {
            prevSubscriptionsFlag = setFeatureFlag(SUBSCRIPTIONS, true)
        })

        afterAll(() => {
            setFeatureFlag(SUBSCRIPTIONS, prevSubscriptionsFlag)
        })

        test('returns true when no organizations at address', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp)

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(true)
        })

        test('returns false when organization at address has no subscription', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [organization] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property] = await createTestProperty(admin, organization)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property.address,
                addressMeta: property.addressMeta,
            })

            await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [b2cApp.id],
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(false)
        })

        test('returns true when organization has active subscription with app enabled', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [organization] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property] = await createTestProperty(admin, organization)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property.address,
                addressMeta: property.addressMeta,
            })

            const [plan] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [b2cApp.id],
            })

            await createTestSubscriptionContext(admin, organization, plan, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(true)
        })

        test('returns false when organization has active subscription but app not enabled', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [organization] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property] = await createTestProperty(admin, organization)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property.address,
                addressMeta: property.addressMeta,
            })

            await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [b2cApp.id],
            })

            const [anotherPlan] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [],
            })

            await createTestSubscriptionContext(admin, organization, anotherPlan, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(false)
        })

        test('returns true when app not restricted by any plan', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [organization] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property] = await createTestProperty(admin, organization)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property.address,
                addressMeta: property.addressMeta,
            })

            const [plan] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [],
            })

            await createTestSubscriptionContext(admin, organization, plan, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(true)
        })

        test('returns true when no plans exist for organization type', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [organization] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property] = await createTestProperty(admin, organization)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property.address,
                addressMeta: property.addressMeta,
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(true)
        })

        test('returns true when at least one organization has app enabled (multiple orgs)', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [org1] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [org2] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property1] = await createTestProperty(admin, org1)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property1.address,
                addressMeta: property1.addressMeta,
            })
            
            await createTestProperty(admin, org2, {
                address: property1.address,
                addressMeta: property1.addressMeta,
            })

            const [plan] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [b2cApp.id],
            })

            const [planWithoutApp] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [],
            })

            await createTestSubscriptionContext(admin, org1, planWithoutApp, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            await createTestSubscriptionContext(admin, org2, plan, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(true)
        })

        test('returns false when all organizations have subscriptions but app not enabled in any', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const [org1] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [org2] = await createTestOrganization(admin, { type: MANAGING_COMPANY_TYPE })
            const [property1] = await createTestProperty(admin, org1)
            
            const [appProperty] = await createTestB2CAppProperty(admin, b2cApp, {
                address: property1.address,
                addressMeta: property1.addressMeta,
            })
            
            await createTestProperty(admin, org2, {
                address: property1.address,
                addressMeta: property1.addressMeta,
            })

            await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [b2cApp.id],
            })

            const [planWithoutApp] = await createTestSubscriptionPlan(admin, {
                organizationType: MANAGING_COMPANY_TYPE,
                enabledB2CApps: [],
            })

            await createTestSubscriptionContext(admin, org1, planWithoutApp, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            await createTestSubscriptionContext(admin, org2, planWithoutApp, {
                startAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().add(30, 'days').format('YYYY-MM-DD'),
            })

            const properties = await B2CAppProperty.getAll(admin, { id: appProperty.id }, 'id isAvailable')
            expect(properties).toHaveLength(1)
            expect(properties[0].isAvailable).toBe(false)
        })
    })
})
