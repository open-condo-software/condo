const dayjs = require('dayjs')

const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
} = require('@open-condo/webhooks/constants')
const {
    createTestWebhookPayload,
    softDeleteTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookCronTasks } = require('@open-condo/webhooks/tasks/cronTasks')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')

const RetryFailedWebhookPayloadsTests = (appName, actorsInitializer) => {
    describe(`retryFailedWebhookPayloads cron task tests for ${appName} app`, () => {
        let retryFailedWebhookPayloads
        let sendWebhookPayload
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
            retryFailedWebhookPayloads = getWebhookCronTasks()['retryFailedWebhookPayloads']
            sendWebhookPayload = getWebhookRegularTasks()['sendWebhookPayload']
        })

        it('Must find and queue pending payloads that are due for retry', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.subtract(1, 'minute').toISOString()

            // Create a payload that is due for retry
            const [payload1] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            // Create another payload that is due for retry
            const [payload2] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook2',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 2,
            })

            // Spy on the sendWebhookPayload task to verify it gets called
            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was called for both our payloads
            // Note: There may be other payloads from previous tests, so we just verify our payloads were called
            expect(delaySpy).toHaveBeenCalledWith(payload1.id)
            expect(delaySpy).toHaveBeenCalledWith(payload2.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload1.id)
            await softDeleteTestWebhookPayload(actors.admin, payload2.id)
        })

        it('Must skip payloads that are not due for retry yet', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.add(1, 'hour').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was not called for this payload
            expect(delaySpy).not.toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip payloads that are already expired', async () => {
            const now = dayjs()
            const expiresAt = now.subtract(1, 'hour').toISOString()
            const nextRetryAt = now.subtract(2, 'hour').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was not called for expired payload
            expect(delaySpy).not.toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip payloads in success status', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.subtract(1, 'minute').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_SENT,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was not called for success payload
            expect(delaySpy).not.toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip payloads in failed status', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.subtract(1, 'minute').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_ERROR,
                expiresAt,
                nextRetryAt,
                attempt: 5,
            })

            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was not called for failed payload
            expect(delaySpy).not.toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })

        it('Must skip soft-deleted payloads', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.subtract(1, 'minute').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            // Soft delete the payload
            await softDeleteTestWebhookPayload(actors.admin, payload.id)

            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay')

            await retryFailedWebhookPayloads.delay.fn()

            // Verify that sendWebhookPayload.delay was not called for deleted payload
            expect(delaySpy).not.toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()
        })

        it('Must handle errors when queueing payloads', async () => {
            const now = dayjs()
            const expiresAt = now.add(7, 'day').toISOString()
            const nextRetryAt = now.subtract(1, 'minute').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/webhook',
                status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                expiresAt,
                nextRetryAt,
                attempt: 1,
            })

            // Mock sendWebhookPayload.delay to throw an error
            const delaySpy = jest.spyOn(sendWebhookPayload, 'delay').mockRejectedValue(new Error('Queue error'))

            // Should not throw, just log the error
            await expect(retryFailedWebhookPayloads.delay.fn()).resolves.not.toThrow()

            expect(delaySpy).toHaveBeenCalledWith(payload.id)

            delaySpy.mockRestore()

            await softDeleteTestWebhookPayload(actors.admin, payload.id)
        })
    })
}

module.exports = {
    RetryFailedWebhookPayloadsTests,
}
