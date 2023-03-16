/**
 * @jest-environment node
 */

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const {
    WebhookSubscription,
    createTestWebhook,
    createTestWebhookSubscription,
    softDeleteTestWebhook,
    softDeleteTestWebhookSubscription,
    updateTestWebhookSubscription,
} = require('@open-condo/webhooks/schema/utils/testSchema')
// eslint-disable-next-line import/order
const utils = require('@open-condo/webhooks/tasks/tasks.utils')

const STABLE_URL = faker.internet.url()
const STABLE_CALLS = []
let ODD_COUNTER = 0
const ODD_URL = faker.internet.url()
const ODD_CALLS = []

jest.spyOn(utils, 'trySendData').mockImplementation((url, objs) => {
    if (url === STABLE_URL) {
        STABLE_CALLS.push(objs)
        return Promise.resolve({ ok: true, status: 200 })
    } if (url === ODD_URL) {
        ++ODD_COUNTER
        if (ODD_COUNTER % 2 === 1) {
            ODD_CALLS.push(objs)
            return Promise.resolve({ ok: true, status: 200 })
        } else {
            return Promise.resolve({ ok: false, status: 500 })
        }
    } else {
        return Promise.resolve({ ok: false, status: 523 })
    }
})

jest.mock('@open-condo/webhooks/tasks/sendModelWebhooks', () => {
    const { find } = require('@open-condo/keystone/schema')
    const { createTask } = require('@open-condo/keystone/tasks')
    const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')

    async function sendModelWebhooks (modelName) {
        const subscriptions = await find('WebhookSubscription', {
            deletedAt: null,
            model: modelName,
            webhook: { deletedAt: null },
        })

        for (const subscription of subscriptions) {
            await sendWebhook.delay.fn(subscription.id)
        }
    }

    return {
        sendModelWebhooks: createTask('sendModelWebhooks', sendModelWebhooks, { priority: 3 }),
    }
})

jest.mock('@open-condo/webhooks/plugins/webHooked', () => {
    const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
    const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')
    const { getModelValidator } = require('@open-condo/webhooks/model-validator')
    const { sendModelWebhooks } = require('@open-condo/webhooks/tasks')

    const plugin = (fn) => {
        fn._type = GQL_SCHEMA_PLUGIN
        return fn
    }

    const webHooked = () => plugin((schema, { schemaName }) => {
        const validator = getModelValidator()
        if (!validator || validator.models.includes(schemaName)) {
            return schema
        }

        validator.registerModel(schemaName)
        const { hooks: { afterChange: originalHook, ...restHooks }, ...rest } = schema

        const syncAfterChange = async () => {
            await sendModelWebhooks.delay.fn(schemaName)
        }

        const afterChange = composeNonResolveInputHook(originalHook, syncAfterChange)

        return {
            hooks: {
                afterChange,
                ...restHooks,
            },
            ...rest,
        }
    })

    return {
        webHooked,
    }
})

// eslint-disable-next-line import/order
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')

const SendWebhookTests = (appName, actorsInitializer, userCreator, userUpdater, userDestroyer, entryPointPath) => {
    describe(`sendWebhook task basic tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })
        let actors
        let firstUser
        let deletedUser
        let lastUser
        beforeAll(async () => {
            actors = await actorsInitializer()
        })
        beforeEach(async () => {
            firstUser = await userCreator()
            const secondUser = await userCreator()
            deletedUser = await userDestroyer(actors.admin, secondUser)
            lastUser = await userCreator()
        })
        afterEach(() => {
            STABLE_CALLS.splice(0)
        })
        describe('Must correctly send requests and update subscription state', () => {
            describe('with an "operations" equal to', async () => {
                const cases = [
                    [
                        'null (default)',
                        null,
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                                expect.objectContaining({ id: deletedUser.id }),
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS[1]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                            ]))
                            expect(STABLE_CALLS[2]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(5)
                        },
                    ],
                    [
                        'create',
                        { create: true, update: false, delete: false },
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                                expect.objectContaining({ id: deletedUser.id }),
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(3)
                        },
                    ],
                    [
                        'update',
                        { create: false, update: true, delete: false },
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                                expect.objectContaining({ id: deletedUser.id }),
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS[1]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                            ]))
                            expect(STABLE_CALLS[2]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(5)
                        },
                    ],
                    [
                        'delete',
                        { create: false, update: false, delete: true },
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: deletedUser.id }),
                            ]))
                            expect(STABLE_CALLS[1]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(2)
                        },
                    ],
                    [
                        'create and delete',
                        { create: true, update: false, delete: true },
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                                expect.objectContaining({ id: deletedUser.id }),
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS[1]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(4)
                        },
                    ],
                    [
                        'create and update',
                        { create: true, update: true, delete: false },
                        () => {
                            // NOTE: DELETED USER MUST BE IN SENT DATA
                            expect(STABLE_CALLS[0]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                                expect.objectContaining({ id: deletedUser.id }),
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS[1]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: firstUser.id }),
                            ]))
                            expect(STABLE_CALLS[2]).toEqual(expect.arrayContaining([
                                expect.objectContaining({ id: lastUser.id }),
                            ]))
                            expect(STABLE_CALLS.flat()).toHaveLength(5)
                        },
                    ],
                ]

                it.each(cases)('%p', async (name, operations, specificTests) => {
                    const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
                    const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                        syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond'),
                        url: STABLE_URL,
                        operations,
                    })
                    expect(subscription).toHaveProperty('syncedAt')
                    const initialSyncTime = dayjs(subscription.syncedAt)
                    await sendWebhook.delay.fn(subscription.id)

                    const updatedSubscription = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
                    expect(updatedSubscription).toHaveProperty('syncedAt')
                    const syncTime = dayjs(updatedSubscription.syncedAt)
                    expect(syncTime.isSame(initialSyncTime)).toEqual(false)
                    expect(syncTime.isAfter(initialSyncTime)).toEqual(true)
                    expect(updatedSubscription).toHaveProperty('syncedAmount', 0)

                    await userUpdater(actors.admin, firstUser, {
                        name: faker.name.firstName(),
                    })
                    await userDestroyer(actors.admin, lastUser)

                    await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
                    await softDeleteTestWebhook(actors.admin, hook.id)

                    specificTests()
                })
            })
        })
        it('Must correctly save state on failures', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond'),
                url: ODD_URL,
                maxPackSize: 1,
            })
            expect(subscription).toHaveProperty('syncedAt')
            expect(subscription).toHaveProperty('failuresCount', 0)
            expect(subscription).toHaveProperty('syncedAmount', 0)
            const initialSyncTime = dayjs(subscription.syncedAt)

            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt')
            const syncTime = dayjs(updated.syncedAt)
            // NOTE: Only one user must be in sent data
            expect(syncTime.isSame(initialSyncTime)).toEqual(true)
            expect(updated).toHaveProperty('failuresCount', 1)
            expect(updated).toHaveProperty('syncedAmount', 1)
            expect(ODD_CALLS).toHaveLength(1)
            expect(ODD_CALLS[0]).toHaveLength(1)

            await sendWebhook.delay.fn(subscription.id)

            const newUpdated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(newUpdated).toHaveProperty('syncedAt')
            const newSyncTime = dayjs(updated.syncedAt)
            // NOTE: 1 more object is sent
            expect(newSyncTime.isSame(initialSyncTime)).toEqual(true)
            expect(newUpdated).toHaveProperty('syncedAmount', 2)
            expect(ODD_CALLS).toHaveLength(2)
            expect(ODD_CALLS[1]).toHaveLength(1)

            await updateTestWebhookSubscription(actors.admin, subscription.id, {
                maxPackSize: null,
            })

            await sendWebhook.delay.fn(subscription.id)

            const lastUpdated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(lastUpdated).toHaveProperty('syncedAt')
            const lastSyncTime = dayjs(lastUpdated.syncedAt)
            // NOTE: Rest of objects was sent
            expect(lastSyncTime.isSame(initialSyncTime)).toEqual(false)
            expect(lastSyncTime.isAfter(initialSyncTime)).toEqual(true)
            expect(lastUpdated).toHaveProperty('syncedAmount', 0)
            expect(lastUpdated).toHaveProperty('failuresCount', 0)
            expect(ODD_CALLS).toHaveLength(3)
            expect(ODD_CALLS[2].length).toBeGreaterThanOrEqual(1)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
    })
}


module.exports = {
    SendWebhookTests,
}
