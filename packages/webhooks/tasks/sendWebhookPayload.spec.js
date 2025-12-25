const crypto = require('node:crypto')

const dayjs = require('dayjs')
const nock = require('nock')

const { getKVClient } = require('@open-condo/keystone/kv')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
} = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
    softDeleteTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')

const BASE_URL = 'http://test-webhook-server.local'
const SUCCESS_PATH = '/success'
const FAILURE_PATH = '/failure'
const VERIFY_SIGNATURE_PATH = '/verify-signature'

let SUCCESS_CALLS = []
let FAILURE_CALLS = []

const SendWebhookPayloadTests = (appName, actorsInitializer) => {
    describe(`sendWebhookPayload task basic tests for ${appName} app`, () => {
        let sendWebhookPayload
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
            sendWebhookPayload = getWebhookRegularTasks()['sendWebhookPayload']
        })

        beforeEach(() => {
            nock.cleanAll()
        })

        afterEach(() => {
            SUCCESS_CALLS = []
            FAILURE_CALLS = []
            nock.cleanAll()
        })

        afterAll(() => {
            nock.restore()
        })

        it('Must successfully send webhook payload and update status to success', async () => {
            const scope = nock(BASE_URL)
                .post(SUCCESS_PATH)
                .reply(function (uri, requestBody) {
                    SUCCESS_CALLS.push({ url: uri, body: requestBody, headers: this.req.headers })
                    return [200, { received: true }]
                })

            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${SUCCESS_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            expect(payload).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(payload).toHaveProperty('attempt', 0)

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_SENT)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastHttpStatusCode', 200)
            expect(updated).toHaveProperty('lastResponseBody')
            expect(updated.lastResponseBody).toContain('received')
            expect(updated).toHaveProperty('lastSentAt')
            expect(updated).toHaveProperty('lastErrorMessage', null)

            expect(SUCCESS_CALLS).toHaveLength(1)
            expect(SUCCESS_CALLS[0].headers).toHaveProperty('x-webhook-id', payload.id)
            expect(SUCCESS_CALLS[0].headers).toHaveProperty('x-webhook-signature')
            expect(scope.isDone()).toBe(true)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must send webhook with valid HMAC-SHA256 signature that can be verified', async () => {
            const testSecret = 'test-webhook-secret-123'
            let receivedSignature = null
            let receivedBody = null
            let signatureValid = false

            const scope = nock(BASE_URL)
                .post(VERIFY_SIGNATURE_PATH)
                .reply(function (uri, requestBody) {
                    receivedSignature = this.req.headers['x-webhook-signature']
                    receivedBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)

                    // Verify signature using the test secret and raw body bytes
                    // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
                    const expectedSignature = crypto
                        .createHmac('sha256', testSecret)
                        .update(receivedBody)
                        .digest('hex')
                    signatureValid = receivedSignature === expectedSignature

                    return [200, { verified: signatureValid }]
                })

            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${VERIFY_SIGNATURE_PATH}`,
                secret: testSecret,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_SENT)
            expect(updated).toHaveProperty('lastHttpStatusCode', 200)

            // Verify signature was sent and is valid
            expect(receivedSignature).toBeTruthy()
            expect(receivedBody).toBeTruthy()
            expect(signatureValid).toBe(true)

            // Manually verify the signature again to ensure correctness
            // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
            const manualSignature = crypto
                .createHmac('sha256', testSecret)
                .update(receivedBody)
                .digest('hex')
            expect(receivedSignature).toBe(manualSignature)
            expect(scope.isDone()).toBe(true)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip processing if payload is locked', async () => {
            const kvClient = getKVClient('sendWebhookPayload', 'lock')
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${SUCCESS_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            const lockKey = `sendWebhookPayload:${payload.id}`
            await kvClient.set(lockKey, 'test-lock', 'EX', 60)

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(updated).toHaveProperty('attempt', 0)
            expect(SUCCESS_CALLS).toHaveLength(0)

            await kvClient.del(lockKey)
            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must release lock after processing', async () => {
            nock(BASE_URL)
                .post(SUCCESS_PATH)
                .reply(200, { received: true })

            const kvClient = getKVClient('sendWebhookPayload', 'lock')
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${SUCCESS_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            const lockKey = `sendWebhookPayload:${payload.id}`

            await sendWebhookPayload.delay.fn(payload.id)

            const lockValueAfter = await kvClient.get(lockKey)
            expect(lockValueAfter).toBeNull()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must handle failure and schedule retry when not expired', async () => {
            const scope = nock(BASE_URL)
                .post(FAILURE_PATH)
                .reply(function (uri, requestBody) {
                    FAILURE_CALLS.push({ url: uri, body: requestBody, headers: this.req.headers })
                    return [500, { error: 'Internal Server Error' }]
                })

            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${FAILURE_PATH}`,
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
            expect(scope.isDone()).toBe(true)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must mark as failed when next retry would be after expiration', async () => {
            nock(BASE_URL)
                .post(FAILURE_PATH)
                .reply(500, { error: 'Internal Server Error' })

            const expiresAt = dayjs().add(30, 'second').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${FAILURE_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_ERROR)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastErrorMessage', 'HTTP 500: Internal Server Error')
            expect(updated).toHaveProperty('lastSentAt')

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must mark as failed when payload is already expired', async () => {
            const expiresAt = dayjs().subtract(1, 'hour').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${SUCCESS_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_ERROR)
            expect(updated).toHaveProperty('lastErrorMessage', 'Payload expired after TTL')
            expect(updated).toHaveProperty('attempt', 0)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip processing if payload is already in success status', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${SUCCESS_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_SENT,
                expiresAt,
                attempt: 1,
            })

            const initialCallsLength = SUCCESS_CALLS.length

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_SENT)
            expect(updated).toHaveProperty('attempt', 1)

            expect(SUCCESS_CALLS).toHaveLength(initialCallsLength)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip processing if payload is already in failed status', async () => {
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${FAILURE_PATH}`,
                status: WEBHOOK_PAYLOAD_STATUS_ERROR,
                expiresAt,
                attempt: 5,
            })

            const initialCallsLength = FAILURE_CALLS.length

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_ERROR)
            expect(updated).toHaveProperty('attempt', 5)

            expect(FAILURE_CALLS).toHaveLength(initialCallsLength)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        // NOTE: This test takes ~10 seconds due to the WEBHOOK_PAYLOAD_TIMEOUT_IN_MS (10s) timeout.
        // We use a non-routable IP address because nock's delay() doesn't properly trigger
        // the timeout - it delays the response but the request still completes successfully.
        it('Must handle timeout errors correctly', async () => {
            // Use a non-routable IP address (RFC 5737 TEST-NET-1) to trigger real network timeout
            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://192.0.2.1:9999/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                attempt: 0,
            })

            await sendWebhookPayload.delay.fn(payload.id)

            const updated = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(updated).toHaveProperty('status', WEBHOOK_PAYLOAD_STATUS_PENDING)
            expect(updated).toHaveProperty('attempt', 1)
            expect(updated).toHaveProperty('lastErrorMessage')
            expect(updated.lastErrorMessage).toContain('timeout')
            expect(updated).toHaveProperty('nextRetryAt')
            expect(updated).toHaveProperty('lastHttpStatusCode', null)

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        }, 20000)

        it('Must increment attempt counter on each retry', async () => {
            nock(BASE_URL)
                .post(FAILURE_PATH)
                .reply(500, { error: 'Internal Server Error' })

            const expiresAt = dayjs().add(7, 'day').toISOString()
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: `${BASE_URL}${FAILURE_PATH}`,
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
