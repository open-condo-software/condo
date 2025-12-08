const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SUCCESS,
    WEBHOOK_PAYLOAD_STATUS_FAILED,
} = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')
// eslint-disable-next-line import/order
const webhookUtils = require('@open-condo/webhooks/utils/webhookPayload.utils')

// Track calls to trySendWebhookPayload
const SEND_CALLS = []
let SEND_SHOULD_SUCCEED = true

jest.spyOn(webhookUtils, 'trySendWebhookPayload').mockImplementation((payload) => {
    SEND_CALLS.push(payload)
    if (SEND_SHOULD_SUCCEED) {
        return Promise.resolve({ success: true, statusCode: 200, body: '{"received":true}' })
    } else {
        return Promise.resolve({ success: false, statusCode: 500, body: 'Server error', error: 'HTTP 500: Internal Server Error' })
    }
})

// eslint-disable-next-line import/order
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')


const SendWebhookPayloadTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`sendWebhookPayload task tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

        let actors
        let sendWebhookPayloadTask

        beforeAll(async () => {
            actors = await actorsInitializer()
            sendWebhookPayloadTask = getWebhookTasks()['sendWebhookPayload']
        })

        beforeEach(() => {
            SEND_CALLS.length = 0
            SEND_SHOULD_SUCCEED = true
        })

        it('should successfully deliver webhook payload and update status', async () => {
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: faker.internet.url(),
                payload: { event: 'test.event', data: { id: '123' } },
                secret: faker.random.alphaNumeric(32),
                eventType: 'test.event',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
            })

            await sendWebhookPayloadTask.delay.fn(payload.id)

            const updatedPayload = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updatedPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_SUCCESS)
            expect(updatedPayload.lastHttpStatusCode).toBe(200)
            expect(updatedPayload.attempt).toBe(1)
            expect(SEND_CALLS).toHaveLength(1)
            expect(SEND_CALLS[0].id).toBe(payload.id)

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayloadHistoryRecord').where({ history_id: payload.id }).del()
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })

        it('should schedule retry on delivery failure', async () => {
            SEND_SHOULD_SUCCEED = false

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: faker.internet.url(),
                payload: { event: 'test.event', data: { id: '123' } },
                secret: faker.random.alphaNumeric(32),
                eventType: 'test.event',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
            })

            await sendWebhookPayloadTask.delay.fn(payload.id)

            const updatedPayload = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updatedPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(updatedPayload.lastHttpStatusCode).toBe(500)
            expect(updatedPayload.lastErrorMessage).toBe('HTTP 500: Internal Server Error')
            expect(updatedPayload.attempt).toBe(1)
            expect(dayjs(updatedPayload.nextRetryAt).isAfter(dayjs())).toBe(true)

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayloadHistoryRecord').where({ history_id: payload.id }).del()
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })

        it('should mark as failed when expired', async () => {
            const expiredDate = dayjs().subtract(1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: faker.internet.url(),
                payload: { event: 'test.event', data: { id: '123' } },
                secret: faker.random.alphaNumeric(32),
                eventType: 'test.event',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt: expiredDate,
            })

            await sendWebhookPayloadTask.delay.fn(payload.id)

            const updatedPayload = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updatedPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_FAILED)
            expect(updatedPayload.lastErrorMessage).toBe('Payload expired after TTL')
            expect(SEND_CALLS).toHaveLength(0) // Should not attempt delivery

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayloadHistoryRecord').where({ history_id: payload.id }).del()
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })

        it('should skip already processed payloads', async () => {
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: faker.internet.url(),
                payload: { event: 'test.event', data: { id: '123' } },
                secret: faker.random.alphaNumeric(32),
                eventType: 'test.event',
                status: WEBHOOK_PAYLOAD_STATUS_SUCCESS, // Already successful
            })

            await sendWebhookPayloadTask.delay.fn(payload.id)

            // Should not attempt delivery
            expect(SEND_CALLS).toHaveLength(0)

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayloadHistoryRecord').where({ history_id: payload.id }).del()
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })

        it('should mark as permanently failed when next retry would be after expiration', async () => {
            SEND_SHOULD_SUCCEED = false

            // Set expiration to very soon (before next retry would happen)
            const soonExpiration = dayjs().add(30, 'second').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: faker.internet.url(),
                payload: { event: 'test.event', data: { id: '123' } },
                secret: faker.random.alphaNumeric(32),
                eventType: 'test.event',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt: soonExpiration,
                attempt: 5, // High attempt count means longer retry delay
            })

            await sendWebhookPayloadTask.delay.fn(payload.id)

            const updatedPayload = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updatedPayload.status).toBe(WEBHOOK_PAYLOAD_STATUS_FAILED)
            expect(updatedPayload.lastErrorMessage).toBe('HTTP 500: Internal Server Error')

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayloadHistoryRecord').where({ history_id: payload.id }).del()
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })
    })
}


module.exports = {
    SendWebhookPayloadTests,
}
