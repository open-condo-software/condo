const faker = require('faker')
const {
    createTestWebhook,
    softDeleteTestWebhook,
    createTestWebhookSubscription,
    updateTestWebhookSubscription,
    softDeleteTestWebhookSubscription,
    WebhookSubscription,
} = require('@condo/webhooks/schema/utils/testSchema')
const { WebHookModelValidator } = require('@condo/webhooks/model-validator')
const {
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowValidationFailureError,
} = require('@condo/keystone/test.utils')

const WebhookSubscriptionTests = (appName, actorsInitializer) => {
    describe(`WebhookSubscription tests for ${appName} app`, () => {
        let actors
        beforeAll(async () => {
            actors = await actorsInitializer()
        })
        describe('CRUD tests', () => {
            const allPermissionActors = [
                ['admin'],
                ['support'],
            ]
            test.each(allPermissionActors)('%p can read and manage WebhookSubscriptions', async (role) => {
                const actor = actors[role]
                const [webhook] = await createTestWebhook(actor, actor.user)
                expect(webhook).toHaveProperty('id')
                const url = faker.internet.url()
                const [createdSubscriptoin, attrs] = await createTestWebhookSubscription(actor, webhook, {
                    url,
                })
                expect(createdSubscriptoin).toBeDefined()
                expect(createdSubscriptoin).toHaveProperty('id')

                const subscriptions = await WebhookSubscription.getAll(actor, { id: createdSubscriptoin.id })
                expect(subscriptions).toBeDefined()
                expect(subscriptions).toHaveLength(1)
                const subscription = subscriptions[0]
                expect(subscription).toHaveProperty('id')
                expect(subscription).toHaveProperty(['webhook', 'id'], webhook.id)
                expect(subscription).toHaveProperty(['webhook', 'url'])
                expect(subscription).toHaveProperty(['webhook', 'user', 'id'], actor.user.id)
                expect(subscription).toHaveProperty('syncedAt', attrs.syncedAt)
                expect(subscription).toHaveProperty('model', attrs.model)
                expect(subscription).toHaveProperty('fields', WebHookModelValidator.normalizeFieldsString(attrs.fields))
                expect(subscription).toHaveProperty('filters', attrs.filters)
                expect(subscription).toHaveProperty('url', url)

                const newUrl = faker.internet.url()
                const [updated] = await updateTestWebhookSubscription(actor, subscription.id, {
                    url: newUrl,
                })
                expect(updated).toBeDefined()
                expect(updated).toHaveProperty('url', newUrl)
                expect(updated).toHaveProperty('deletedAt', null)

                const [deleted] = await softDeleteTestWebhookSubscription(actor, subscription.id)
                expect(deleted).toBeDefined()
                expect(deleted).toHaveProperty('deletedAt')
                expect(deleted.deletedAt).not.toBeNull()

                await softDeleteTestWebhook(actor, webhook.id)
            })
            test('User cannot manage WebhookSubscriptions, but can read subscription if its webhook is assigned to him', async  () => {
                const [assignedHook] = await createTestWebhook(actors.admin, actors.user.user)
                const [notAssignedHook] = await createTestWebhook(actors.admin, actors.admin.user)
                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await createTestWebhookSubscription(actors.user, assignedHook)
                })

                const [assignedSubscription] = await createTestWebhookSubscription(actors.admin, assignedHook)
                const [notAssignedSubscription] = await createTestWebhookSubscription(actors.admin, notAssignedHook)

                await expectToThrowAccessDeniedErrorToObj(async () => {
                    await updateTestWebhookSubscription(actors.user, assignedSubscription.id, {
                        url: faker.internet.url(),
                    })
                })

                const subscriptions = await WebhookSubscription.getAll(actors.user, {
                    id_in: [assignedSubscription.id, notAssignedSubscription.id],
                })
                expect(subscriptions).toBeDefined()
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0]).toHaveProperty('id', assignedSubscription.id)


                await softDeleteTestWebhookSubscription(actors.admin, assignedSubscription.id)
                await softDeleteTestWebhookSubscription(actors.admin, notAssignedSubscription.id)
                await softDeleteTestWebhook(actors.admin, assignedHook.id)
                await softDeleteTestWebhook(actors.admin, notAssignedHook.id)
            })
            test('Anonymous has no access to reading and managing hook subscriptions', async () => {
                const [webhook] = await createTestWebhook(actors.admin, actors.admin.user)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await createTestWebhookSubscription(actors.anonymous, webhook)
                })

                const [subscription] = await createTestWebhookSubscription(actors.admin, webhook)
                await expectToThrowAuthenticationErrorToObj(async () => {
                    await updateTestWebhookSubscription(actors.anonymous, subscription.id, {
                        url: faker.internet.url(),
                    })
                })

                await expectToThrowAuthenticationErrorToObjects(async  () => {
                    await WebhookSubscription.getAll(actors.anonymous, {})
                })

                await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
                await softDeleteTestWebhook(actors.admin, webhook.id)
            })
        })
        describe('Hooks', () => {
            let hook
            beforeAll(async () => {
                [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            })
            afterAll(async () => {
                await softDeleteTestWebhook(actors.admin, hook.id)
            })
            describe('ResolveInput must normalize fields field', () => {
                let subscription
                beforeAll(async () => {
                    [subscription] = await createTestWebhookSubscription(actors.admin, hook)
                })
                afterAll(async () => {
                    await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
                })
                const userFields = [
                    'id',
                    'type      email',
                    '{type}',
                ]
                test.each(userFields)('%p', async (fields) => {
                    const [object] = await updateTestWebhookSubscription(actors.admin, subscription.id, {
                        fields,
                    })
                    expect(object).toBeDefined()
                    expect(object).toHaveProperty('fields', WebHookModelValidator.normalizeFieldsString(fields))
                })
            })
            describe('"Fields" field', () => {
                describe('Must throw validation error on wrong fields', () => {
                    const cases = [
                        ['No fields', ''],
                        ['No fields wrapped', '{ }'],
                        ['No subfields 1', '{ sender { } }'],
                        ['No subfields 2', '{ { } }'],
                        ['Incorrect field', '{ coolField }'],
                        ['Incorrect subfield', '{ sender { receiver } }'],
                    ]
                    test.each(cases)('%p', async (name, fields) => {
                        await expectToThrowValidationFailureError(async () => {
                            await createTestWebhookSubscription(actors.admin, hook, {
                                fields,
                            })
                        }, 'Invalid fields for model "User" was provided')
                    })
                })
                describe('Must pass validation with correct fields', () => {
                    const cases = [
                        ['id'],
                        ['id sender { dv }'],
                        ['id sender \n{ dv}type'],
                        ['{id sender \n{ dv}type }'],
                        ['{ id id id id }'],
                    ]
                    test.each(cases)('%p', async (fields) => {
                        const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                            fields,
                        })
                        expect(subscription).toBeDefined()
                        expect(subscription).toHaveProperty('fields', WebHookModelValidator.normalizeFieldsString(fields))
                    })
                })
            })
            describe('"Filters" field', () => {
                describe('Must throw validation error on wrong filters', () => {
                    const cases = [
                        ['Non-existing filter', { name_not_begins_with: 'Theo' }],
                        ['Non-matching type of filter', { deletedAt: true }],
                    ]
                    test.each(cases)('%p', async (name, filters) => {
                        await expectToThrowValidationFailureError(async () => {
                            await createTestWebhookSubscription(actors.admin, hook, {
                                filters,
                            })
                        }, 'Invalid filters for model "User" was provided')
                    })
                })
                describe('Must pass validation with correct filters', () => {
                    const cases = [
                        ['Empty filter', {}],
                        ['Simple string', { name_contains_i: 'Michelle' }],
                        ['Simple Bool', { isSupport: true }],
                        ['Simple ID', { id_in: ['123', '456'] }],
                        ['Simple enum', { type: 'resident' }],
                        ['Combined', { type: 'resident', deletedAt_not: null }],
                        ['AND', { AND: [{ isSupport: true }, { deletedAt: null }] }],
                        ['OR', { type: 'resident', OR: [{ deletedAt_not: null }, { deletedAt: null }] }],
                    ]
                    test.each(cases)('%p', async (name, filters) => {
                        const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                            filters,
                        })
                        expect(subscription).toBeDefined()
                        expect(subscription).toHaveProperty('filters')
                        expect(subscription.filters).toEqual(filters)

                        await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
                    })
                })
            })
        })
    })
}

module.exports = {
    WebhookSubscriptionTests,
}