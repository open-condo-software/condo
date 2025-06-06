const { makeLoggedInAdminClient, makeClient, UUID_RE, makeLoggedInClient } = require('@open-condo/keystone/test.utils')
const {
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
} = require('@open-condo/keystone/test.utils')

const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const { ConfirmEmailAction, createTestConfirmEmailAction, updateTestConfirmEmailAction, createTestUser } = require('@condo/domains/user/utils/testSchema')
 
describe('ConfirmEmailAction', () => {
    describe('CRUD tests', () => {
        describe('create', () => {
            test('admin can', async () => {
                const admin = await makeLoggedInAdminClient()
                const [obj, attrs] = await createTestConfirmEmailAction(admin)
                expect(obj.id).toMatch(UUID_RE)
                expect(obj.dv).toEqual(1)
                expect(obj.sender).toEqual(attrs.sender)
                expect(obj.email).toBeDefined()
                expect(obj.token).toBeDefined()
            })

            test('anonymous can\'t', async () => {
                const anonymousClient = await makeClient()
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestConfirmEmailAction(anonymousClient)
                })
            })
        })

        describe('update', () => {
            test('admin can update any', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestConfirmEmailAction(admin)
                const payload = { emailCode: 123456 }
                const [objUpdated] = await updateTestConfirmEmailAction(admin, objCreated.id, payload)
                expect(objUpdated.id).toEqual(objCreated.id)
                expect(objUpdated.emailCode).toEqual(payload.emailCode)
            })

            test('user can\'t update others', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestConfirmEmailAction(admin)
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                const payload = { emailCode: 999999 }
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmEmailAction(userClient, objCreated.id, payload)
                })
            })

            test('anonymous can\'t update', async () => {
                const admin = await makeLoggedInAdminClient()
                const [objCreated] = await createTestConfirmEmailAction(admin)
                const anonymousClient = await makeClient()
                const payload = { emailCode: 888888 }
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestConfirmEmailAction(anonymousClient, objCreated.id, payload)
                })
            })
        })

        describe('read', () => {
            test('admin can\' read all', async () => {
                const admin = await makeLoggedInAdminClient()
                const [, userAttrs] = await createTestUser(admin)
                const client = await makeLoggedInClient(userAttrs)
                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await ConfirmEmailAction.getAll(client)
                })
            })

            test('user can\'t read others', async () => {
                const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await ConfirmEmailAction.getAll(userClient)
                })
            })

            test('anonymous can\'t read', async () => {
                const anonymousClient = await makeClient()
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await ConfirmEmailAction.getAll(anonymousClient, {})
                })
            })
        })

        describe('delete', () => {
            test('admin can\'t delete', async () => {
                const admin = await makeLoggedInAdminClient()
                const [obj] = await createTestConfirmEmailAction(admin)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await ConfirmEmailAction.delete(admin, obj.id)
                })
            })
        })
    })

    describe('Validation tests', () => {
        test('should have correct dv field (=== 1)', async () => {
            const admin = await makeLoggedInAdminClient()
            const [obj] = await createTestConfirmEmailAction(admin)
            expect(obj.dv).toEqual(1)
        })
    })
})