const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const { Client } = require('pg')

const conf = require('@open-condo/config')
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

const ENDPOINTS = {}

class WebhookEndpoint {
    calls = []
    receiveObjs (objs) {
        this.calls.push(objs)
        return Promise.resolve({ ok: true, status: 200 })
    }
}

class OddWebhookEndpoint extends WebhookEndpoint {
    counter = 0
    receiveObjs (objs) {
        ++this.counter
        if (this.counter % 2 === 1) {
            return super.receiveObjs(objs)
        }
        return Promise.resolve({ ok: false, status: 500 })
    }
}

class FailOnceEndpoint extends WebhookEndpoint {
    constructor (idsToFail) {
        super()
        this.failed = Object.fromEntries(idsToFail.map(id => [id, false]))
    }

    receiveObjs (objs) {
        const objIds = objs.map(obj => obj.id)
        const targetIds = objIds.filter(id => id in this.failed)
        const shouldFail = targetIds.some(id => !this.failed[id])

        if (!shouldFail) {
            return super.receiveObjs(objs)
        }
        targetIds.forEach((id) => {
            this.failed[id] = true
        })
        return Promise.resolve({ ok: false, status: 500 })
    }
}

jest.spyOn(utils, 'trySendData').mockImplementation((url, objs) => {
    if (url in ENDPOINTS) {
        return ENDPOINTS[url].receiveObjs(objs)
    } else {
        return Promise.resolve({ ok: false, status: 523 })
    }
})

// eslint-disable-next-line import/order
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')

function getPGClient () {
    const dbUrl = conf['DATABASE_URL']
    const [protoPrefix] = dbUrl.split(':')
    const conn = protoPrefix === 'custom'
        ? JSON.parse(dbUrl.slice(protoPrefix.length + 1)).main
        : dbUrl

    return new Client(conn)
}

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
            const url = faker.internet.url()
            const endpoint = new WebhookEndpoint()
            ENDPOINTS[url] = endpoint

            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond').toISOString(),
                url,
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
            expect(endpoint.calls).toEqual(expect.arrayContaining([expect.arrayContaining([
                expect.objectContaining({ id: firstUser.id }),
                expect.objectContaining({ id: deletedUser.id }),
                expect.objectContaining({ id: lastUser.id }),
            ])]))

            delete ENDPOINTS[url]
        })
        it('Must correctly save state on failures', async () => {
            const url = faker.internet.url()
            const endpoint = new OddWebhookEndpoint()
            ENDPOINTS[url] = endpoint

            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond').toISOString(),
                url,
                maxPackSize: 1,
            })
            expect(subscription).toHaveProperty('syncedAt')
            expect(subscription).toHaveProperty('failuresCount', 0)
            const initialSyncTime = dayjs(subscription.syncedAt)

            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt')
            const syncTime = dayjs(updated.syncedAt)
            // NOTE: Only one user must be in sent data
            expect(syncTime.isAfter(initialSyncTime)).toEqual(true)
            expect(updated).toHaveProperty('failuresCount', 1)
            expect(endpoint.calls).toHaveLength(1)
            expect(endpoint.calls[0]).toHaveLength(1)

            await sendWebhook.delay.fn(subscription.id)

            const newUpdated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(newUpdated).toHaveProperty('syncedAt')
            const newSyncTime = dayjs(newUpdated.syncedAt)
            // NOTE: 1 more object is sent
            expect(newSyncTime.isAfter(initialSyncTime)).toEqual(true)
            expect(newSyncTime.isAfter(syncTime)).toEqual(true)
            expect(endpoint.calls).toHaveLength(2)
            expect(endpoint.calls[1]).toHaveLength(1)

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
            expect(lastUpdated).toHaveProperty('failuresCount', 0)
            expect(endpoint.calls).toHaveLength(3)
            expect(endpoint.calls[2].length).toBeGreaterThanOrEqual(1)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
            delete ENDPOINTS[url]
        })
        it('Must correctly handle collision detection - success case with same updatedAt between batches', async () => {
            const url = faker.internet.url()
            const endpoint = new WebhookEndpoint()
            ENDPOINTS[url] = endpoint

            const collisionUser1 = await userCreator()
            const collisionUser2 = await userCreator()
            const collisionUser3 = await userCreator()
            const collisionUser4 = await userCreator()

            const baseTime = collisionUser1.createdAt
            const client = getPGClient()
            await client.connect()
            try {
                await client.query('UPDATE "User" SET "updatedAt" = $1 WHERE id = $2', [baseTime, collisionUser2.id])
                await client.query('UPDATE "User" SET "updatedAt" = $1 WHERE id = $2', [baseTime, collisionUser3.id])
            } finally {
                await client.end()
            }

            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(baseTime).subtract(5, 'millisecond').toISOString(),
                url,
                maxPackSize: 1,
            })

            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt')
            const syncTime = dayjs(updated.syncedAt)
            expect(syncTime.isSame(dayjs(collisionUser4.createdAt))).toEqual(true)
            expect(updated).toHaveProperty('failuresCount', 0)

            expect(endpoint.calls.length).toBeGreaterThanOrEqual(4)
            const receivedIds = endpoint.calls.flatMap(batch => batch.map(i => i.id))
            expect(receivedIds).toEqual(expect.arrayContaining([
                collisionUser1.id,
                collisionUser2.id,
                collisionUser3.id,
                collisionUser4.id,
            ]))

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
            delete ENDPOINTS[url]
        })
        it('Must correctly handle collision detection - fail case with same updatedAt between batches', async () => {
            const collisionUser1 = await userCreator()
            let collisionUser2 = await userCreator()
            let collisionUser3 = await userCreator()

            const collisionTime = collisionUser2.createdAt

            const client = getPGClient()
            await client.connect()
            try {
                await client.query('UPDATE "User" SET "updatedAt" = $1 WHERE id = $2', [collisionTime, collisionUser3.id])
            } finally {
                await client.end()
            }

            if (collisionUser2.id.localeCompare(collisionUser3.id, 'en') > 0) {
                [collisionUser2, collisionUser3] = [collisionUser3, collisionUser2]
            }

            const url = faker.internet.url()
            const endpoint = new FailOnceEndpoint([collisionUser3.id])
            ENDPOINTS[url] = endpoint

            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(collisionUser1.createdAt).subtract(5, 'millisecond').toISOString(),
                url,
                maxPackSize: 1,
            })

            // NOTE: It sends user1, user2 and fails on user3,
            // but since user2 and user3 has same updatedAt, it stores user1.updatedAt in state
            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', collisionUser1.createdAt)
            expect(endpoint.calls).toHaveLength(2)
            
            // NOTE: now, since partially delivered on user2.updatedAt, we send it 1 more time and then send user 3
            await sendWebhook.delay.fn(subscription.id)

            const final =  await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(final).toHaveProperty('syncedAt', collisionTime)
            expect(endpoint.calls).toHaveLength(4)
            expect(endpoint.calls.flatMap(batch => batch.map(i => i.id))).toEqual([
                collisionUser1.id,
                collisionUser2.id,
                collisionUser2.id,
                collisionUser3.id,
            ])

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
            delete ENDPOINTS[url]
        })
        it('Subsequent calls must not trigger data sending', async () => {
            const url = faker.internet.url()
            const endpoint = new WebhookEndpoint()
            ENDPOINTS[url] = endpoint

            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs().toISOString(),
                url,
            })
            expect(subscription).toHaveProperty('syncedAt')

            await sendWebhook.delay.fn(subscription.id)
            await sendWebhook.delay.fn(subscription.id)

            expect(endpoint.calls).toHaveLength(0)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)

            delete ENDPOINTS[url]
        })
    })
}


module.exports = {
    SendWebhookTests,
}
