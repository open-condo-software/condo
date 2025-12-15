const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

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

// eslint-disable-next-line import/order
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')

const SendWebhookTests = (appName, actorsInitializer, userCreator, userDestroyer) => {
    describe(`sendWebhook task basic tests for ${appName} app`, () => {
        let sendWebhook
        let actors
        let firstUser
        let deletedUser
        let lastUser
        beforeAll(async () => {
            actors = await actorsInitializer()
            firstUser = await userCreator()
            const secondUser = await userCreator()
            deletedUser = await userDestroyer(actors.admin, secondUser)
            lastUser = await userCreator()
            sendWebhook = getWebhookRegularTasks()['sendWebhook']
        })
        it('Must correctly send requests and update subscription state', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond'),
                url: STABLE_URL,
            })
            expect(subscription).toHaveProperty('syncedAt')
            const initialSyncTime = dayjs(subscription.syncedAt)
            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt')
            const syncTime = dayjs(updated.syncedAt)
            expect(syncTime.isSame(initialSyncTime)).toEqual(false)
            expect(syncTime.isAfter(initialSyncTime)).toEqual(true)
            expect(updated).toHaveProperty('syncedAmount', 0)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)

            // NOTE: DELETED USER MUST BE IN SENT DATA
            expect(STABLE_CALLS).toEqual(expect.arrayContaining([expect.arrayContaining([
                expect.objectContaining({ id: firstUser.id }),
                expect.objectContaining({ id: deletedUser.id }),
                expect.objectContaining({ id: lastUser.id }),
            ])]))
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
