const dayjs = require('dayjs')

const { makeClient, expectToThrowAccessDeniedErrorToObj, expectToThrowAccessDeniedErrorToObjects } = require('@open-condo/keystone/test.utils')

const {
    ConfirmPhoneAction,
    createTestConfirmPhoneAction,
    updateTestConfirmPhoneAction,
    makeLoggedInAdminClient,
    makeRegisteredAndLoggedInUser,
    makeLoggedInSupportClient,
    startConfirmPhoneActionByTestClient,
} = require('@dev-api/domains/user/utils/testSchema')

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
    describe('Model is internal, so any actions with it is restricted', () => {
        describe('Create',  () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestConfirmPhoneAction(actors[actor])
                })
            })
        })
        describe('Read', () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObjects(async () => {
                    await ConfirmPhoneAction.getAll(actors[actor], {})
                })
            })
        })
        describe('Update', () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors[actor], actionId, {})
                })
            })
        })
        describe('Soft-delete', () => {
            test.each(Object.keys(actors))('%p cannot', async (actor) => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestConfirmPhoneAction(actors[actor], actionId, {
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