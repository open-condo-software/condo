const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { makeClient } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const {
    B2BApp,
    createTestB2BApp,
    updateTestB2BApp,
    updateTestB2BApps,
} = require('@dev-portal-api/domains/miniapp/utils/testSchema')
const {
    makeLoggedInAdminClient,
    makeLoggedInSupportClient,
    makeRegisteredAndLoggedInUser,
} = require('@dev-portal-api/domains/user/utils/testSchema')

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
})
