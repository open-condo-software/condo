const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    makeClient,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@open-condo/keystone/test.utils')

const { CONFIRM_PHONE_ACTION_CODE_LENGTH } = require('@dev-portal-api/domains/user/constants')
const {
    ConfirmPhoneAction,
    createTestConfirmPhoneAction,
    updateTestConfirmPhoneAction,
    makeLoggedInAdminClient,
    makeRegisteredAndLoggedInUser,
    makeLoggedInSupportClient,
    startConfirmPhoneActionByTestClient,
    createTestPhone,
} = require('@dev-portal-api/domains/user/utils/testSchema')

describe('ConfirmPhoneAction', () => {
    const actors = {
        admin: undefined,
        support: undefined,
        user: undefined,
        anonymous: undefined,
    }
    let actionId
    beforeAll(async () => {
        actors.admin = await makeLoggedInAdminClient()
        actors.anonymous = await makeClient()
        actors.user = await makeRegisteredAndLoggedInUser()
        actors.support = await makeLoggedInSupportClient();
        [{ actionId }] = await startConfirmPhoneActionByTestClient({})
    })
    describe('CRUD', () => {
        describe('Create',  () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestConfirmPhoneAction(actors[actor])
                })
            })
        })
        describe('Read', () => {
            test('Admin can read ConfirmPhoneActions', async () => {
                const actions = await ConfirmPhoneAction.getAll(actors.admin, {}, { first: 100 })
                expect(actions.length).toBeGreaterThan(0)
            })
            test('Support cannot', async () => {
                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await ConfirmPhoneAction.getAll(actors.support, {})
                })
            })
            test('User cannot', async () => {
                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await ConfirmPhoneAction.getAll(actors.support, {})
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await ConfirmPhoneAction.getAll(actors.anonymous, {})
                })
            })
        })
        describe('Update', () => {
            test('Admin can update expiresAt', async () => {
                const [updatedAction] = await updateTestConfirmPhoneAction(actors.admin, actionId, {
                    expiresAt: dayjs().toISOString(),
                })
                expect(updatedAction).toBeDefined()

                const payloads = [
                    { phone: createTestPhone() },
                    { code: faker.random.numeric(CONFIRM_PHONE_ACTION_CODE_LENGTH) },
                    { isVerified: true },
                ]

                for (const payload of payloads) {
                    await expectToThrowAccessDeniedErrorToObj(async () => {
                        await updateTestConfirmPhoneAction(actors.admin, updatedAction.id, payload)
                    })
                }
            })
            test('Support cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.support, actionId, {})
                })
            })
            test('User cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.user, actionId, {})
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.anonymous, actionId, {})
                })
            })
        })
        describe('Soft-delete', () => {
            test('Admin can update', async () => {
                const [updatedAction] = await updateTestConfirmPhoneAction(actors.admin, actionId, {
                    deletedAt: dayjs().toISOString(),
                })
                expect(updatedAction).toHaveProperty('deletedAt')
                expect(updatedAction.deletedAt).not.toBeNull()
            })
            test('Support cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.support, actionId, {
                        deletedAt: dayjs().toISOString(),
                    })
                })
            })
            test('User cannot', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.user, actionId, {
                        deletedAt: dayjs().toISOString(),
                    })
                })
            })
            test('Anonymous cannot', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors.anonymous, actionId, {
                        deletedAt: dayjs().toISOString(),
                    })
                })
            })
        })
        describe('Hard-delete', () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await ConfirmPhoneAction.delete(actors[actor], actionId)
                })
            })
        })
    })
})