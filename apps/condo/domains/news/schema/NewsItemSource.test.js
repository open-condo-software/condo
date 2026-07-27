const { makeLoggedInAdminClient, makeClient, UUID_RE, expectValuesOfCommonFields } = require('@open-condo/keystone/test.utils')

const {
    expectToThrowAuthenticationErrorToObj, expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
} = require('@open-condo/keystone/test.utils')

const { NEWS_ITEM_SOURCE_TYPES } = require('@condo/domains/news/constants/newsItemSourceTypes')
const { makeClientWithNewRegisteredAndLoggedInUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')

const { NewsItemSource, createTestNewsItemSource, updateTestNewsItemSource } = require('@condo/domains/news/utils/testSchema')

describe('NewsItemSource', () => {
    describe('CRUD tests', () => {
        describe('create', () => {
            test('admin can', async () => {
                const admin = await makeLoggedInAdminClient()

                const [obj, attrs] = await createTestNewsItemSource(admin)

                expectValuesOfCommonFields(obj, attrs, admin)
                expect(obj.type).toEqual(NEWS_ITEM_SOURCE_TYPES.WEB_APP)
                expect(obj.isDefault).toEqual(false)
            })

            test('support can\'t', async () => {
                const client = await makeClientWithSupportUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestNewsItemSource(client)
                })
            })

            test('user can\'t', async () => {
                const client = await makeClientWithNewRegisteredAndLoggedInUser()

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestNewsItemSource(client)
                })
            })

            test('anonymous can\'t', async () => {
                const client = await makeClient()

                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestNewsItemSource(client)
                })
            })
        })

        describe('update', () => {
            test('admin can', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestNewsItemSource(admin)

                const [obj, attrs] = await updateTestNewsItemSource(admin, objCreated.id)

                expect(obj.dv).toEqual(1)
                expect(obj.sender).toEqual(attrs.sender)
                expect(obj.v).toEqual(2)
                expect(obj.updatedBy).toEqual(expect.objectContaining({ id: admin.user.id }))
            })

            test('user can\'t', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestNewsItemSource(admin)

                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestNewsItemSource(client, objCreated.id)
                })
            })

            test('anonymous can\'t', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestNewsItemSource(admin)

                const client = await makeClient()
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestNewsItemSource(client, objCreated.id)
                })
            })
        })

        describe('hard delete', () => {
            test('admin can\'t', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestNewsItemSource(admin)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await NewsItemSource.delete(admin, objCreated.id)
                })
            })
        })

        describe('read', () => {
            test('admin can', async () => {
                const admin = await makeLoggedInAdminClient()
                const [obj] = await createTestNewsItemSource(admin)

                const objs = await NewsItemSource.getAll(admin, { id: obj.id })

                expect(objs).toHaveLength(1)
            })

            test('user can', async () => {
                const admin = await makeLoggedInAdminClient()
                const [obj] = await createTestNewsItemSource(admin)

                const client = await makeClientWithNewRegisteredAndLoggedInUser()
                const objs = await NewsItemSource.getAll(client, { id: obj.id })

                expect(objs).toHaveLength(1)
            })

            test('anonymous can\'t', async () => {
                const client = await makeClient()

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await NewsItemSource.getAll(client, {})
                })
            })
        })
    })

    describe('Validation tests', () => {
        test('Should have correct dv field (=== 1)', async () => {
            const admin = await makeLoggedInAdminClient()
            const [obj] = await createTestNewsItemSource(admin)

            expect(obj.dv).toEqual(1)
        })

        test('id matches UUID format', async () => {
            const admin = await makeLoggedInAdminClient()
            const [obj] = await createTestNewsItemSource(admin)

            expect(obj.id).toMatch(UUID_RE)
        })
    })
})
