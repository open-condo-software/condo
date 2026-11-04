const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

jest.mock('@open-condo/webhooks/config', () => ({
    WEBHOOK_SYNC_DELAY_IN_SEC: 5,
}))

const { WEBHOOK_SYNC_DELAY_IN_SEC } = require('@open-condo/webhooks/config')
const {
    WebhookSubscription,
    createTestWebhook,
    createTestWebhookSubscription,
    softDeleteTestWebhook,
    softDeleteTestWebhookSubscription,
} = require('@open-condo/webhooks/schema/utils/testSchema')
// eslint-disable-next-line import/order
const utils = require('@open-condo/webhooks/tasks/tasks.utils')

const STABLE_URL = faker.internet.url()
const STABLE_CALLS = []
let ODD_COUNTER = 0
const ODD_URL = faker.internet.url()
const ODD_CALLS = []
const SCRIPTED_URL = faker.internet.url()
const SCRIPTED_CALLS = []
let scriptedResponseHandler

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
    } if (url === SCRIPTED_URL) {
        SCRIPTED_CALLS.push(objs)
        return scriptedResponseHandler(objs)
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
        beforeEach(() => {
            STABLE_CALLS.length = 0
            ODD_CALLS.length = 0
            ODD_COUNTER = 0
            SCRIPTED_CALLS.length = 0
            scriptedResponseHandler = () => Promise.resolve({ ok: true, status: 200 })
            const currentTime = Date.now()
            const taskTime = currentTime + (WEBHOOK_SYNC_DELAY_IN_SEC + 5) * 1000
            jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setInterval', 'setTimeout'] })
                .setSystemTime(taskTime)
        })
        afterEach(() => {
            jest.useRealTimers()
        })
        beforeAll(async () => {
            actors = await actorsInitializer()
            firstUser = await userCreator()
            const secondUser = await userCreator()
            deletedUser = await userDestroyer(actors.admin, secondUser)
            lastUser = await userCreator()
            sendWebhook = getWebhookRegularTasks()['sendWebhook']
        })
        const createUsersAt = async (updatedAt, count) => {
            jest.setSystemTime(updatedAt.toDate())
            const users = []
            for (let index = 0; index < count; ++index) {
                users.push(await userCreator())
            }
            return users
        }
        const setTaskTimeAfter = (updatedAt) => {
            const taskTime = updatedAt.add(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            jest.setSystemTime(taskTime.toDate())
            return taskTime
        }
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
        it('Must advance syncedAt to the stable cutoff when no objects are returned', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const syncedAt = dayjs().subtract(1, 'hour')
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: syncedAt.toISOString(),
                url: STABLE_URL,
                filters: { id: faker.datatype.uuid() },
            })
            const syncStart = dayjs()

            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            const expectedSyncCutoff = syncStart.subtract(WEBHOOK_SYNC_DELAY_IN_SEC, 'second')
            expect(dayjs(updated.syncedAt).valueOf()).toBe(expectedSyncCutoff.valueOf())
            expect(updated).toHaveProperty('syncedAmount', 0)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must deliver a single-object timestamp group', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const updatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            const [user] = await createUsersAt(updatedAt, 1)
            const taskTime = setTaskTimeAfter(updatedAt)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: updatedAt.subtract(1, 'millisecond').toISOString(),
                url: STABLE_URL,
                maxPackSize: 2,
                filters: { id: user.id },
            })

            await sendWebhook.delay.fn(subscription.id)

            expect(STABLE_CALLS).toEqual([[expect.objectContaining({ id: user.id })]])
            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', taskTime.subtract(WEBHOOK_SYNC_DELAY_IN_SEC, 'second').toISOString())

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must defer models newer than the cutoff until the next sync', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const recentUser = await userCreator()
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: dayjs(firstUser.updatedAt).subtract(10, 'millisecond'),
                url: STABLE_URL,
                filters: { id_in: [firstUser.id, recentUser.id] },
            })
            const initialCallsCount = STABLE_CALLS.length

            await sendWebhook.delay.fn(subscription.id)

            const firstSyncCalls = STABLE_CALLS.slice(initialCallsCount).flat()
            expect(firstSyncCalls).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: firstUser.id }),
            ]))
            expect(firstSyncCalls).not.toEqual(expect.arrayContaining([
                expect.objectContaining({ id: recentUser.id }),
            ]))

            jest.setSystemTime(dayjs().add(WEBHOOK_SYNC_DELAY_IN_SEC, 'second').toDate())
            const callsBeforeSecondSync = STABLE_CALLS.length
            await sendWebhook.delay.fn(subscription.id)

            const secondSyncCalls = STABLE_CALLS.slice(callsBeforeSecondSync).flat()
            expect(secondSyncCalls).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: recentUser.id }),
            ]))

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must deliver an entire updatedAt group before advancing syncedAt', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const groupUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            jest.setSystemTime(groupUpdatedAt.toDate())
            const users = await createUsersAt(groupUpdatedAt, 8)
            const syncTime = groupUpdatedAt.add(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            jest.setSystemTime(syncTime.toDate())
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: groupUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: STABLE_URL,
                maxPackSize: 2,
                filters: { id_in: users.map(({ id }) => id) },
            })
            const callsBeforeSync = STABLE_CALLS.length

            await sendWebhook.delay.fn(subscription.id)

            const sentUserIds = STABLE_CALLS
                .slice(callsBeforeSync)
                .flat()
                .map(({ id }) => id)
            expect(sentUserIds).toEqual(expect.arrayContaining(users.map(({ id }) => id)))
            expect(sentUserIds).toHaveLength(users.length)
            expect(STABLE_CALLS.slice(callsBeforeSync)).toHaveLength(4)
            expect(STABLE_CALLS.slice(callsBeforeSync).flat()).not.toEqual(expect.arrayContaining([
                expect.objectContaining({ _webhookSyncUpdatedAt: expect.any(String) }),
            ]))

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', syncTime.subtract(WEBHOOK_SYNC_DELAY_IN_SEC, 'second').toISOString())

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must deliver the safe prefix before a timestamp group', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const firstUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 4, 'second')
            const [first] = await createUsersAt(firstUpdatedAt, 1)
            const [second] = await createUsersAt(firstUpdatedAt.add(1, 'millisecond'), 1)
            const timestampGroup = await createUsersAt(firstUpdatedAt.add(2, 'millisecond'), 3)
            const taskTime = setTaskTimeAfter(firstUpdatedAt.add(2, 'millisecond'))
            const users = [first, second, ...timestampGroup]
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: firstUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: STABLE_URL,
                maxPackSize: 3,
                filters: { id_in: users.map(({ id }) => id) },
            })

            await sendWebhook.delay.fn(subscription.id)

            const sentUserIds = STABLE_CALLS.flat().map(({ id }) => id)
            expect(sentUserIds).toEqual(expect.arrayContaining(users.map(({ id }) => id)))
            expect(sentUserIds).toHaveLength(users.length)
            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', taskTime.subtract(WEBHOOK_SYNC_DELAY_IN_SEC, 'second').toISOString())

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must not skip remaining objects when a delivered object becomes ineligible', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const firstUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 6, 'second')
            const users = []
            for (let index = 0; index < 5; ++index) {
                users.push(...await createUsersAt(firstUpdatedAt.add(index, 'millisecond'), 1))
            }
            setTaskTimeAfter(firstUpdatedAt.add(4, 'millisecond'))
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: firstUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: SCRIPTED_URL,
                maxPackSize: 2,
                filters: { id_in: users.map(({ id }) => id), deletedAt: null },
            })
            scriptedResponseHandler = async () => {
                if (SCRIPTED_CALLS.length === 1) {
                    await userDestroyer(actors.admin, users[0])
                }
                return { ok: true, status: 200 }
            }

            await sendWebhook.delay.fn(subscription.id)

            const sentUserIds = SCRIPTED_CALLS.flat().map(({ id }) => id)
            expect(sentUserIds).toEqual(expect.arrayContaining(users.map(({ id }) => id)))
            expect(sentUserIds).toHaveLength(users.length)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must retry a partially sent timestamp group without advancing syncedAt', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const groupUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            const users = await createUsersAt(groupUpdatedAt, 2)
            setTaskTimeAfter(groupUpdatedAt)
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: groupUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: SCRIPTED_URL,
                maxPackSize: 1,
                filters: { id_in: users.map(({ id }) => id) },
            })
            const responses = [
                { ok: true, status: 200 },
                { ok: false, status: 500 },
                { ok: true, status: 200 },
                { ok: true, status: 200 },
            ]
            scriptedResponseHandler = () => Promise.resolve(responses.shift())

            await sendWebhook.delay.fn(subscription.id)

            const afterFailure = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(afterFailure).toHaveProperty('syncedAt', subscription.syncedAt)
            expect(SCRIPTED_CALLS).toHaveLength(2)

            await sendWebhook.delay.fn(subscription.id)

            const afterRetry = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(dayjs(afterRetry.syncedAt).isAfter(subscription.syncedAt)).toBe(true)
            expect(SCRIPTED_CALLS).toHaveLength(4)
            expect(SCRIPTED_CALLS[0]).toEqual(SCRIPTED_CALLS[2])

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must keep the last successful cursor when a later batch fails', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const firstUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 4, 'second')
            const [first] = await createUsersAt(firstUpdatedAt, 1)
            const [second] = await createUsersAt(firstUpdatedAt.add(1, 'millisecond'), 1)
            const [third] = await createUsersAt(firstUpdatedAt.add(2, 'millisecond'), 1)
            setTaskTimeAfter(firstUpdatedAt.add(2, 'millisecond'))
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: firstUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: SCRIPTED_URL,
                maxPackSize: 2,
                filters: { id_in: [first.id, second.id, third.id] },
            })
            scriptedResponseHandler = () => Promise.resolve(SCRIPTED_CALLS.length === 1
                ? { ok: true, status: 200 }
                : { ok: false, status: 500 })

            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', second.updatedAt)
            expect(SCRIPTED_CALLS).toHaveLength(2)
            expect(SCRIPTED_CALLS[0].map(({ id }) => id)).toEqual(expect.arrayContaining([first.id, second.id]))
            expect(SCRIPTED_CALLS[1]).toEqual([expect.objectContaining({ id: third.id })])

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
        it('Must not advance syncedAt if sending a timestamp group fails', async () => {
            const [hook] = await createTestWebhook(actors.admin, actors.admin.user)
            const groupUpdatedAt = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            jest.setSystemTime(groupUpdatedAt.toDate())
            const users = await Promise.all([userCreator(), userCreator()])
            const syncTime = groupUpdatedAt.add(WEBHOOK_SYNC_DELAY_IN_SEC + 1, 'second')
            jest.setSystemTime(syncTime.toDate())
            const [subscription] = await createTestWebhookSubscription(actors.admin, hook, {
                syncedAt: groupUpdatedAt.subtract(1, 'millisecond').toISOString(),
                url: ODD_URL,
                maxPackSize: 1,
                filters: { id_in: users.map(({ id }) => id) },
            })
            expect(subscription).toHaveProperty('syncedAt')
            expect(subscription).toHaveProperty('failuresCount', 0)
            expect(subscription).toHaveProperty('syncedAmount', 0)
            await sendWebhook.delay.fn(subscription.id)

            const updated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(updated).toHaveProperty('syncedAt', subscription.syncedAt)
            expect(updated).toHaveProperty('failuresCount', 1)
            expect(updated).toHaveProperty('syncedAmount', 0)
            expect(ODD_CALLS).toHaveLength(1)
            expect(ODD_CALLS[0]).toHaveLength(1)

            await sendWebhook.delay.fn(subscription.id)

            const newUpdated = await WebhookSubscription.getOne(actors.admin, { id: subscription.id })
            expect(newUpdated).toHaveProperty('syncedAt', subscription.syncedAt)
            expect(newUpdated).toHaveProperty('failuresCount', 1)
            expect(newUpdated).toHaveProperty('syncedAmount', 0)
            expect(ODD_CALLS).toHaveLength(2)
            expect(ODD_CALLS[1]).toHaveLength(1)

            await softDeleteTestWebhookSubscription(actors.admin, subscription.id)
            await softDeleteTestWebhook(actors.admin, hook.id)
        })
    })
}


module.exports = {
    SendWebhookTests,
}
