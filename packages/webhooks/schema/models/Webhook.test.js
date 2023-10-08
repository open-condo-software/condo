const { faker } = require('@faker-js/faker')

const {
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
} = require('@open-condo/keystone/test.utils')
const {
    Webhook,
    createTestWebhook,
    updateTestWebhook,
    softDeleteTestWebhook,
} = require('@open-condo/webhooks/schema/utils/testSchema')

const WebhookTests = (appName, actorsInitializer) => {
    describe(`Webhook tests for ${appName} app`, () => {
        let actors
        beforeAll(async () => {
            actors = await actorsInitializer()
        })
        describe('CRUD tests', () => {
            const allPermissionActors = [
                ['admin'],
                ['support'],
            ]
            test.each(allPermissionActors)('%p can read and manage webhooks', async (actorName) => {
                const actor = actors[actorName]
                const [webhook] = await createTestWebhook(actor, actor.user)
                expect(webhook).toBeDefined()
                expect(webhook).toHaveProperty('id')
                expect(webhook).toHaveProperty(['user', 'id'], actor.user.id)

                const [updatedWebhook] = await updateTestWebhook(actor, webhook.id, {
                    user: { connect: { id: actors.user.user.id } },
                })
                expect(updatedWebhook).toBeDefined()
                expect(updatedWebhook).toHaveProperty(['user', 'id'], actors.user.user.id)
                expect(updatedWebhook).toHaveProperty('deletedAt')
                expect(updatedWebhook.deletedAt).toBeNull()

                const webhooks = await Webhook.getAll(actors.admin, { id: webhook.id })
                expect(webhooks).toBeDefined()
                expect(webhooks).toHaveLength(1)
                expect(webhooks[0]).toEqual(expect.objectContaining({ id: webhook.id }))

                const [deletedWebhook] = await softDeleteTestWebhook(actor, webhook.id)
                expect(deletedWebhook).toBeDefined()
                expect(deletedWebhook).toHaveProperty('deletedAt')
                expect(deletedWebhook.deletedAt).not.toBeNull()
            })
            test('User has only read-access to self-assigned webhooks', async () => {
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestWebhook(actors.user, actors.user.user)
                })

                const [webhookWithUser] = await createTestWebhook(actors.admin, actors.user.user)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestWebhook(actors.user, webhookWithUser.id, {
                        name: faker.company.companyName(0),
                    })
                })

                const [webhookWithoutUser] = await createTestWebhook(actors.admin, actors.admin.user)
                const webhooks = await Webhook.getAll(actors.user, {})
                expect(webhooks).toBeDefined()
                expect(webhooks).toHaveLength(1)
                expect(webhooks[0]).toEqual(expect.objectContaining({ id: webhookWithUser.id }))

                await softDeleteTestWebhook(actors.admin, webhookWithUser.id)
                await softDeleteTestWebhook(actors.admin, webhookWithoutUser.id)
            })
            test('Anonymous has no access to reading and managing hooks', async () => {
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestWebhook(actors.anonymous, actors.admin.user)
                })

                const [webhook] = await createTestWebhook(actors.admin, actors.admin.user)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestWebhook(actors.anonymous, webhook.id, {
                        name: faker.company.companyName(0),
                    })
                })

                await expectToThrowAuthenticationErrorToObjects(async () => {
                    await Webhook.getAll(actors.anonymous, {})
                })

                await softDeleteTestWebhook(actors.admin, webhook.id)
            })
        })
    })
}

module.exports = {
    WebhookTests,
}