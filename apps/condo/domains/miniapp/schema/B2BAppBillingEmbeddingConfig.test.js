const { faker } = require('@faker-js/faker')

const { makeLoggedInAdminClient, makeClient } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const { B2BAppBillingEmbeddingConfig, createTestB2BAppBillingEmbeddingConfig, updateTestB2BAppBillingEmbeddingConfig } = require('@condo/domains/miniapp/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')


describe('B2BAppBillingEmbeddingConfig', () => {
    let admin
    let support
    let user
    let anonymous

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        support = await makeClientWithSupportUser()
        user = await makeClientWithNewRegisteredAndLoggedInUser()
        anonymous = await makeClient()
    })

    describe('CRUD tests', () => {
        describe('create', () => {
            test('admin can', async () => {
                const [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
                expect(obj.id).toBeDefined()
                expect(obj.dv).toEqual(1)
            })

            test('support can', async () => {
                const [obj] = await createTestB2BAppBillingEmbeddingConfig(support)
                expect(obj.id).toBeDefined()
                expect(obj.dv).toEqual(1)
            })

            test('user cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestB2BAppBillingEmbeddingConfig(user)
                })
            })

            test('anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestB2BAppBillingEmbeddingConfig(anonymous)
                })
            })
        })

        describe('update', () => {
            let obj

            beforeEach(async () => {
                [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
            })

            test('admin can', async () => {
                const tabUrl = faker.internet.url()
                const [updated] = await updateTestB2BAppBillingEmbeddingConfig(admin, obj.id, { tabUrl })
                expect(updated.v).toEqual(2)
                expect(updated.updatedBy).toEqual(expect.objectContaining({ id: admin.user.id }))
            })

            test('support can', async () => {
                const tabUrl = faker.internet.url()
                const [updated] = await updateTestB2BAppBillingEmbeddingConfig(support, obj.id, { tabUrl })
                expect(updated.v).toEqual(2)
                expect(updated.updatedBy).toEqual(expect.objectContaining({ id: support.user.id }))
            })

            test('user cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestB2BAppBillingEmbeddingConfig(user, obj.id)
                })
            })

            test('anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestB2BAppBillingEmbeddingConfig(anonymous, obj.id)
                })
            })
        })

        describe('hard delete', () => {
            test('admin cannot', async () => {
                const [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2BAppBillingEmbeddingConfig.delete(admin, obj.id)
                })
            })

            test('user cannot', async () => {
                const [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2BAppBillingEmbeddingConfig.delete(user, obj.id)
                })
            })

            test('anonymous cannot', async () => {
                const [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await B2BAppBillingEmbeddingConfig.delete(anonymous, obj.id)
                })
            })
        })

        describe('read', () => {
            let obj

            beforeAll(async () => {
                [obj] = await createTestB2BAppBillingEmbeddingConfig(admin)
            })

            test('admin can', async () => {
                const objs = await B2BAppBillingEmbeddingConfig.getAll(admin, { id: obj.id })
                expect(objs).toHaveLength(1)
                expect(objs[0]).toHaveProperty('id', obj.id)
            })

            test('support can', async () => {
                const objs = await B2BAppBillingEmbeddingConfig.getAll(support, { id: obj.id })
                expect(objs).toHaveLength(1)
                expect(objs[0]).toHaveProperty('id', obj.id)
            })

            test('user can', async () => {
                const objs = await B2BAppBillingEmbeddingConfig.getAll(user, { id: obj.id })
                expect(objs).toHaveLength(1)
                expect(objs[0]).toHaveProperty('id', obj.id)
            })

            test('anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await B2BAppBillingEmbeddingConfig.getAll(anonymous, { id: obj.id })
                })
            })
        })
    })

    describe('Validation tests', () => {
        test('tabUrl field stores and returns a valid URL', async () => {
            const tabUrl = faker.internet.url()
            const [obj] = await createTestB2BAppBillingEmbeddingConfig(admin, { tabUrl })
            expect(obj.tabUrl).toEqual(tabUrl)
        })
    })
})
