const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
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

const logger = getLogger('webhooks:tasks:sendWebhook')

function getKnexClientAndPool (keystone) {
    const ad = keystone.adapter || (keystone.adapters && Object.values(keystone.adapters)[0])
    if (!ad || !ad.knex) return {}
    const knex = ad.knex
    const client = knex.client
    const pool = client && client.pool
    return { knex, client, pool }
}

function readPoolValue (pool, candidates) {
    for (const name of candidates) {
        if (!pool || !(name in pool)) continue
        const v = pool[name]
        if (typeof v === 'function') {
            try { return v.call(pool) } catch { /* ignore */ }
        } else if (Array.isArray(v)) {
            return v.length
        } else if (typeof v === 'number') {
            return v
        }
    }
    return undefined
}

function logPool (keystone, where) {
    const { pool } = getKnexClientAndPool(keystone)
    if (!pool) {
        logger.info({ msg: `[pool:${where}] (no pool)` })
        return
    }
    // Try both the “array fields” style and the “numX()”/numeric style
    const stats = {
        used:            readPoolValue(pool, ['used', 'numUsed', '_using', '_inUseObjects']),
        free:            readPoolValue(pool, ['free', 'numFree', '_available', '_availableObjects']),
        pendingAcquires: readPoolValue(pool, ['pendingAcquires', 'numPendingAcquires', '_pendingAcquires']),
        pendingCreates:  readPoolValue(pool, ['pendingCreates', 'numPendingCreates', '_factoryCreateOperations']),
        size:            readPoolValue(pool, ['size', '_count']),
        available:       readPoolValue(pool, ['available']),
        min:             readPoolValue(pool, ['min']),
        max:             readPoolValue(pool, ['max']),
    }
    logger.info({ msg: `[pool:${where}]`, data: stats })
}


async function dumpPgActivity (keystone, where) {
    const ad = keystone.adapter || Object.values(keystone.adapters)[0]
    const { rows } = await ad.knex.raw(`
    select pid, state, wait_event_type, wait_event, backend_type,
           xact_start, state_change, left(regexp_replace(query, '\\s+', ' ', 'g'), 200) as query
    from pg_stat_activity
    where datname = current_database()
    order by xact_start nulls last, state_change desc
    limit 10;
  `)
    logger.info({ msg: `[pool:${where}]`, data: rows })
}


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
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const SendWebhookTests = (appName, actorsInitializer, userCreator, userDestroyer, entryPointPath) => {
    describe(`sendWebhook task basic tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        let keystone
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

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
            sendWebhook = getWebhookTasks()['sendWebhook']
            const { keystone: context } = getSchemaCtx('WebhookSubscription')
            keystone = context
        })
        it('Must correctly send requests and update subscription state', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.createdAt).subtract(10, 'millisecond'),
                url: STABLE_URL,
            })
            expect(subscription).toHaveProperty('syncedAt')
            const initialSyncTime = dayjs(subscription.syncedAt)
            logPool(keystone, 'before sendWebhook')
            await sendWebhook.delay.fn(subscription.id)
            logPool(keystone, 'after sendWebhook')
            await dumpPgActivity(keystone, 'after sendWebhook')

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
