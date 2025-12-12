const dayjs = require('dayjs')
const express = require('express')

const { setFakeClientMode, initTestExpressApp, getTestExpressApp } = require('@open-condo/keystone/test.utils')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SUCCESS,
    WEBHOOK_PAYLOAD_STATUS_FAILED,
} = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
    softDeleteTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

let SUCCESS_URL
let SUCCESS_CALLS = []
let FAILURE_URL
let FAILURE_CALLS = []
let TIMEOUT_URL
let TIMEOUT_CALLS = []

const SendWebhookPayloadTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`sendWebhookPayload task basic tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

        let sendWebhookPayload
        let actors

        // Create test HTTP server for webhook endpoints
        const app = express()
        app.use(express.json())

        app.post('/success', (req, res) => {
            SUCCESS_CALLS.push({ url: req.url, body: req.body, headers: req.headers })
            res.status(200).json({ received: true })
        })

        app.post('/failure', (req, res) => {
            FAILURE_CALLS.push({ url: req.url, body: req.body, headers: req.headers })
            res.status(500).json({ error: 'Internal Server Error' })
        })

        app.post('/timeout', (req, res) => {
            TIMEOUT_CALLS.push({ url: req.url, body: req.body, headers: req.headers })
            // Don't respond to simulate timeout (client will timeout after 30s)
        })

        initTestExpressApp('webhookTestServer', app)

        beforeAll(async () => {
            actors = await actorsInitializer()
            sendWebhookPayload = getWebhookTasks()['sendWebhookPayload']

            // Get server info after it's started by initTestExpressApp
            const serverInfo = getTestExpressApp('webhookTestServer')
            SUCCESS_URL = `${serverInfo.baseUrl}/success`
            FAILURE_URL = `${serverInfo.baseUrl}/failure`
            TIMEOUT_URL = `${serverInfo.baseUrl}/timeout`
        })

        afterEach(() => {
            SUCCESS_CALLS = []
            FAILURE_CALLS = []
            TIMEOUT_CALLS = []
        })

        it('Must successfully send webhook payload and update status to success', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: SUCCESS_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            expect(payload).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(payload).toHaveProperty('attempt', 0)

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_SUCCESS)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastHttpStatusCode', 200)
            expect(updated).toHaveProperty('lastResponseBody')
            expect(updated.lastResponseBody).toContain('received')
            expect(updated).toHaveProperty('lastSentAt')
            expect(updated).toHaveProperty('lastErrorMessage', null)

            expect(SUCCESS_CALLS).toHaveLength(1)
            expect(SUCCESS_CALLS[0].headers).toHaveProperty('x-webhook-id', payload.id)
            expect(SUCCESS_CALLS[0].headers).toHaveProperty('x-webhook-signature')

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must handle failure and schedule retry when not expired', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: FAILURE_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            expect(payload).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(payload).toHaveProperty('attempt', 0)

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastHttpStatusCode', 500)
            expect(updated).toHaveProperty('lastResponseBody')
            expect(updated.lastResponseBody).toContain('error')
            expect(updated).toHaveProperty('lastErrorMessage', 'HTTP 500: Internal Server Error')
            expect(updated).toHaveProperty('nextRetryAt')
            expect(updated).toHaveProperty('lastSentAt')

            const nextRetryAt = dayjs(updated.nextRetryAt)
            const lastSentAt = dayjs(updated.lastSentAt)
            expect(nextRetryAt.isAfter(lastSentAt)).toBe(true)

            expect(FAILURE_CALLS).toHaveLength(1)
            expect(FAILURE_CALLS[0].headers).toHaveProperty('x-webhook-id', payload.id)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must mark as failed when next retry would be after expiration', async () => {
            const expiresAt = dayjs().add(30, 'second').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: FAILURE_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_FAILED)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastErrorMessage', 'HTTP 500: Internal Server Error')
            expect(updated).toHaveProperty('lastSentAt')

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must mark as failed when payload is already expired', async () => {
            const expiresAt = dayjs().subtract(1, 'hour').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: SUCCESS_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_FAILED)
            expect(updated).toHaveProperty('lastErrorMessage', 'Payload expired after TTL')
            expect(updated).toHaveProperty('attempt', 0)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip processing if payload is already in success status', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: SUCCESS_URL,
                status: WEBHOOK_PAYLOAD_STATUS_SUCCESS,
                expiresAt,
                attempt: 1,
            })

            const initialCallsLength = SUCCESS_CALLS.length

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_SUCCESS)
            expect(updated).toHaveProperty('attempt', 1)

            expect(SUCCESS_CALLS).toHaveLength(initialCallsLength)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip processing if payload is already in failed status', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: FAILURE_URL,
                status: WEBHOOK_PAYLOAD_STATUS_FAILED,
                expiresAt,
                attempt: 5,
            })

            const initialCallsLength = FAILURE_CALLS.length

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_FAILED)
            expect(updated).toHaveProperty('attempt', 5)

            expect(FAILURE_CALLS).toHaveLength(initialCallsLength)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        // NOTE: This test takes ~30 seconds due to the webhook timeout.
        it('Must handle timeout errors correctly', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: TIMEOUT_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            const initialCallsLength = TIMEOUT_CALLS.length

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastErrorMessage')
            expect(updated.lastErrorMessage).toContain('timeout')
            expect(updated).toHaveProperty('nextRetryAt')
            expect(updated).toHaveProperty('lastHttpStatusCode', null)

            expect(TIMEOUT_CALLS).toHaveLength(initialCallsLength + 1)
            expect(TIMEOUT_CALLS[TIMEOUT_CALLS.length - 1].headers).toHaveProperty('x-webhook-id', payload.id)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        }, 45000)

        it('Must increment attempt counter on each retry', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: FAILURE_URL,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 3,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('attempt', 4)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })
    })
}


module.exports = {
    SendWebhookPayloadTests,
}
