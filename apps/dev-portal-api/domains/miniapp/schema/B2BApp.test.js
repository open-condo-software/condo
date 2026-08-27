const path = require('path')

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { makeClient, getUploadingFile } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const { B2B_APP_CATEGORIES, CONTEXT_IN_PROGRESS_STATUS, CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { getDevicePermissions } = require('@condo/domains/miniapp/schema/fields/devicePermissions')
const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const { getEnvironmentalFieldName } = require('@dev-portal-api/domains/miniapp/schema/fields/environmental')
const {
    B2BApp,
    createTestB2BApp,
    publishB2BAppByTestClient,
    updateTestB2BApp,
    updateTestB2BApps,
} = require('@dev-portal-api/domains/miniapp/utils/testSchema')
const {
    makeLoggedInAdminClient,
    makeLoggedInSupportClient,
    makeRegisteredAndLoggedInUser,
} = require('@dev-portal-api/domains/user/utils/testSchema')

const FAKE_B2B_APP_LOGO_PATH = path.resolve(conf.PROJECT_ROOT, 'apps/dev-portal-api/domains/miniapp/utils/testSchema/assets/logo.png')


describe('B2BApp', () => {
    let admin
    let support
    let user
    let anotherUser
    let anonymous
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeLoggedInSupportClient()
        user = await makeRegisteredAndLoggedInUser()
        anotherUser = await makeRegisteredAndLoggedInUser()
        anonymous = await makeClient()
    })
    describe('CRUD tests', () => {
        describe('Create', () => {
            test('Admin can', async () => {
                const [app] = await createTestB2BApp(admin)
                expect(app).toHaveProperty('id')
            })
            test('Support can', async () => {
                const [app] = await createTestB2BApp(support)
                expect(app).toHaveProperty('id')
            })
            test('User can', async () => {
                const [app] = await createTestB2BApp(user)
                expect(app).toHaveProperty('id')
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestB2BApp(anonymous)
                })
            })
        })
        describe('Update', () => {
            let app
            beforeAll(async () => {
                [app] = await createTestB2BApp(user)
            })
            test('Admin can', async () => {
                const name = faker.music.songName()
                const [updatedApp] = await updateTestB2BApp(admin, app.id, { name })
                expect(updatedApp).toHaveProperty('name', name)
            })
            test('Support can', async () => {
                const name = faker.music.songName()
                const [updatedApp] = await updateTestB2BApp(support, app.id, { name })
                expect(updatedApp).toHaveProperty('name', name)
            })
            describe('User', () => {
                test('App creator can', async () => {
                    const name = faker.music.songName()
                    const [updatedApp] = await updateTestB2BApp(user, app.id, { name })
                    expect(updatedApp).toHaveProperty('name', name)
                })
                test('Other users cannot', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        const name = faker.music.songName()
                        await updateTestB2BApp(anotherUser, app.id, { name })
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    const name = faker.music.songName()
                    await updateTestB2BApp(anonymous, app.id, { name })
                })
            })
        })
        describe('Read', () => {
            let app
            beforeAll(async () => {
                [app] = await createTestB2BApp(user)
            })
            test('Admin can', async () => {
                const readApp = await B2BApp.getOne(admin, { id: app.id })
                expect(readApp).toHaveProperty('id', app.id)
            })
            test('Support can', async () => {
                const readApp = await B2BApp.getOne(support, { id: app.id })
                expect(readApp).toHaveProperty('id', app.id)
            })
            describe('User', () => {
                test('App creator can', async () => {
                    const readApp = await B2BApp.getOne(user, { id: app.id })
                    expect(readApp).toHaveProperty('id', app.id)
                })
                test('Other users cannot', async () => {
                    const readApp = await B2BApp.getOne(anotherUser, { id: app.id })
                    expect(readApp).toBeUndefined()
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await B2BApp.getOne(anonymous, { id: app.id })
                })
            })
        })
        describe('Soft-delete', () => {
            let app
            beforeEach(async () => {
                [app] = await createTestB2BApp(user)
            })
            test('Admin can', async () => {
                const [deletedApp] = await updateTestB2BApp(admin, app.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedApp).toHaveProperty('deletedAt')
                expect(deletedApp.deletedAt).not.toBeNull()
            })
            test('Support can', async () => {
                const [deletedApp] = await updateTestB2BApp(support, app.id, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(deletedApp).toHaveProperty('deletedAt')
                expect(deletedApp.deletedAt).not.toBeNull()
            })
            describe('User', () => {
                test('App creator can', async () => {
                    const [deletedApp] = await updateTestB2BApp(user, app.id, {
                        deletedAt: dayjs().toISOString(),
                    })
                    expect(deletedApp).toHaveProperty('deletedAt')
                    expect(deletedApp.deletedAt).not.toBeNull()
                })
                test('Other users cannot', async () => {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestB2BApp(anotherUser, app.id, {
                            deletedAt: dayjs().toISOString(),
                        })
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestB2BApp(anonymous, app.id, {
                        deletedAt: dayjs().toISOString(),
                    })
                })
            })
        })
        test('Hard delete is prohibited', async () => {
            const [app] = await createTestB2BApp(user)
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await B2BApp.delete(admin, app.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await B2BApp.delete(support, app.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await B2BApp.delete(user, app.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await B2BApp.delete(anotherUser, app.id)
            })
            await expectToThrowAccessDeniedErrorToObj(async () => {
                await B2BApp.delete(anonymous, app.id)
            })
        })
        test('Bulk update is supported', async () => {
            const [firstApp] = await createTestB2BApp(user)
            const [secondApp] = await createTestB2BApp(user)
            const name = faker.music.songName()
            const [response] = await updateTestB2BApps(user, [
                { id: firstApp.id, data: { name } },
                { id: secondApp.id, data: { deletedAt: dayjs().toISOString() } },
            ])
            expect(response).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: firstApp.id, name }),
                expect.objectContaining({ id: secondApp.id, deletedAt: expect.stringContaining('') }),
            ]))
        })
    })
    describe('Field resolve input tests', () => {
        describe('modifiedAt', () => {
            const commonFields = {
                name: () => faker.commerce.productName(),
                developer: () => faker.company.name(),
                developerUrl: () => faker.internet.url(),
                shortDescription: () => faker.lorem.sentence(),
                detailedDescription: () => faker.lorem.paragraph(),
                category: () => faker.helpers.arrayElement(B2B_APP_CATEGORIES),
                contextDefaultStatus: () => faker.helpers.arrayElement([CONTEXT_IN_PROGRESS_STATUS, CONTEXT_FINISHED_STATUS]),
                logo: async (client) => {
                    return await getUploadingFile(FAKE_B2B_APP_LOGO_PATH, {
                        user: { id: client?.user?.id },
                        fileClientId: conf['FILE_CLIENT_ID'],
                        modelNames: ['B2BApp'],
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'test-test' },
                    }, client, conf.SERVER_URL)
                },
            }
            const environmentalFields = {
                appUrl: () => {
                    const rawUrl = new URL(faker.internet.url())
                    if (rawUrl.protocol !== 'https:') {
                        rawUrl.protocol = 'https:'
                    }
                    return rawUrl.toString()
                },
                ...Object.fromEntries(getDevicePermissions({ listKey: 'B2BApp' }).map(permission => [`${permission}Allowed`, () => faker.datatype.boolean()])),
            }
            const ignoredFields = {
                dv: () => 1,
                sender: () => ({ dv: 1, fingerprint: 'test-test' }),
            }
            describe('Must update modifiedAt fields for all environments if common field changed', () => {
                test.each(Object.keys(commonFields))('%p field', async (fieldName) => {
                    const [app] = await createTestB2BApp(user)
                    expect(app).toHaveProperty('developmentModifiedAt', expect.stringContaining(''))
                    expect(app).toHaveProperty('productionModifiedAt', expect.stringContaining(''))
                    const fieldValue = await commonFields[fieldName](user)
                    const [updatedApp] = await updateTestB2BApp(user, app.id, { [fieldName]: fieldValue })
                    expect(updatedApp.developmentModifiedAt).not.toEqual(app.developmentModifiedAt)
                    expect(updatedApp.productionModifiedAt).not.toEqual(app.productionModifiedAt)
                })
            })
            describe('Must update modifiedAt for specific environment if environmental field changed', () => {
                describe.each(AVAILABLE_ENVIRONMENTS)('%p environment',  (environment) => {
                    test.each(Object.keys(environmentalFields))('%p field', async (fieldName) => {
                        const [app] = await createTestB2BApp(user)

                        const envModifiedAt = getEnvironmentalFieldName(environment, 'modifiedAt')
                        const otherModifiedAt = getEnvironmentalFieldName(environment === 'development' ? 'production' : 'development', 'modifiedAt')

                        expect(app).toHaveProperty(envModifiedAt, expect.stringContaining(''))
                        expect(app).toHaveProperty(otherModifiedAt, expect.stringContaining(''))

                        const envFieldName = getEnvironmentalFieldName(environment, fieldName)
                        const fieldValue = await environmentalFields[fieldName](user)
                        const [updatedApp] = await updateTestB2BApp(user, app.id, { [envFieldName]: fieldValue })

                        expect(updatedApp[envModifiedAt]).not.toEqual(app[envModifiedAt])
                        expect(updatedApp[otherModifiedAt]).toEqual(app[otherModifiedAt])
                    })
                })
            })
            describe('Must not update modifiedAt fields for non-related fields', () => {
                test.each(Object.keys(ignoredFields))('%p field', async (fieldName) => {
                    const [app] = await createTestB2BApp(user)
                    expect(app).toHaveProperty('developmentModifiedAt', expect.stringContaining(''))
                    expect(app).toHaveProperty('productionModifiedAt', expect.stringContaining(''))
                    const fieldValue = await ignoredFields[fieldName](user)
                    const [updatedApp] = await updateTestB2BApp(user, app.id, { [fieldName]: fieldValue })
                    expect(updatedApp.developmentModifiedAt).toEqual(app.developmentModifiedAt)
                    expect(updatedApp.productionModifiedAt).toEqual(app.productionModifiedAt)
                })
                test('"publishedAt" field', async () => {
                    const [app] = await createTestB2BApp(user)
                    expect(app).toHaveProperty('developmentModifiedAt', expect.stringContaining(''))
                    expect(app).toHaveProperty('productionModifiedAt', expect.stringContaining(''))
                    const [result] = await publishB2BAppByTestClient(user, app)
                    expect(result).toHaveProperty('success', true)
                    const updatedApp = await B2BApp.getOne(user, { id: app.id })
                    expect(updatedApp).toHaveProperty('developmentModifiedAt', app.developmentModifiedAt)
                    expect(updatedApp).toHaveProperty('productionModifiedAt', app.productionModifiedAt)
                })
            })
        })
    })
    describe('Field access tests', () => {
        describe.each(AVAILABLE_ENVIRONMENTS)('%p environment', (environment) => {
            const fieldName = getEnvironmentalFieldName(environment, 'oidcClientId')
            describe(`${fieldName} field`, () => {
                let app
                beforeAll(async () => {
                    [app] = await createTestB2BApp(user)
                })
                describe('Create', () => {
                    test('Admin can', async () => {
                        const clientId = faker.datatype.uuid()
                        const [createdApp] = await createTestB2BApp(admin, { [fieldName]: clientId })
                        expect(createdApp).toHaveProperty(fieldName, clientId)
                    })
                    test('Support can', async () => {
                        const clientId = faker.datatype.uuid()
                        const [createdApp] = await createTestB2BApp(support, { [fieldName]: clientId })
                        expect(createdApp).toHaveProperty(fieldName, clientId)
                    })
                    test('App owner cannot', async () => {
                        await expectToThrowAccessDeniedErrorToObj(async () => {
                            await createTestB2BApp(user, { [fieldName]: faker.datatype.uuid() })
                        })
                    })
                })
                describe('Update', () => {
                    test('Admin can', async () => {
                        const clientId = faker.datatype.uuid()
                        const [updatedApp] = await updateTestB2BApp(admin, app.id, { [fieldName]: clientId })
                        expect(updatedApp).toHaveProperty(fieldName, clientId)
                    })
                    test('Support can', async () => {
                        const clientId = faker.datatype.uuid()
                        const [updatedApp] = await updateTestB2BApp(support, app.id, { [fieldName]: clientId })
                        expect(updatedApp).toHaveProperty(fieldName, clientId)
                    })
                    test('App owner cannot', async () => {
                        await expectToThrowAccessDeniedErrorToObj(async () => {
                            await updateTestB2BApp(user, app.id, { [fieldName]: faker.datatype.uuid() })
                        })
                    })
                    test('Other user cannot', async () => {
                        await expectToThrowAccessDeniedErrorToObj(async () => {
                            await updateTestB2BApp(anotherUser, app.id, { [fieldName]: faker.datatype.uuid() })
                        })
                    })
                })
                describe('Read', () => {
                    test('App owner can', async () => {
                        const readApp = await B2BApp.getOne(user, { id: app.id })
                        expect(readApp).toHaveProperty(fieldName)
                    })
                    test('Admin can', async () => {
                        const readApp = await B2BApp.getOne(admin, { id: app.id })
                        expect(readApp).toHaveProperty(fieldName)
                    })
                })
            })
        })
    })
})
