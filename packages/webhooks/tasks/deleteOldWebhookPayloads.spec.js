const { WebhookPayload, createTestWebhookPayload, softDeleteTestWebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

// Mock the constants module with a short retention period for testing
const MOCK_RETENTION_IN_SEC = 3 // 3 seconds for fast tests
jest.mock('@open-condo/webhooks/constants', () => ({
    ...jest.requireActual('@open-condo/webhooks/constants'),
    WEBHOOK_PAYLOAD_RETENTION_IN_SEC: MOCK_RETENTION_IN_SEC,
}))

const DeleteOldWebhookPayloadsTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`deleteOldWebhookPayloads cron task tests for ${appName} app`, () => {
        let deleteOldWebhookPayloads
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
            const tasks = getWebhookTasks()
            deleteOldWebhookPayloads = tasks['deleteOldWebhookPayloads']
        })

        it('Must hard delete old webhook payloads from database', async () => {
            const [oldPayload1] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old1',
                status: 'sent',
            })
            const [oldPayload2] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old2',
                status: 'error',
            })

            // Wait for retention period to pass (add 500ms buffer)
            await new Promise(resolve => setTimeout(resolve, (MOCK_RETENTION_IN_SEC + 0.5) * 1000))

            // Create recent payload after waiting
            const [recentPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/recent',
                status: 'sent',
            })

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(2)

            const oldPayload1InDb = await WebhookPayload.getAll(actors.admin, { id: oldPayload1.id })
            const oldPayload2InDb = await WebhookPayload.getAll(actors.admin, { id: oldPayload2.id })
            const recentPayloadInDb = await WebhookPayload.getAll(actors.admin, { id: recentPayload.id })

            expect(oldPayload1InDb).toHaveLength(0)
            expect(oldPayload2InDb).toHaveLength(0)
            expect(recentPayloadInDb).toHaveLength(1)
            expect(recentPayloadInDb[0].id).toBe(recentPayload.id)
        }, 10000)

        it('Must not delete payloads within retention period', async () => {
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/within-retention',
                status: 'sent',
            })

            // Don't wait - payload is fresh and within retention period
            await deleteOldWebhookPayloads.delay.fn()

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(1)
            expect(payloadInDb[0].id).toBe(payload.id)
        })

        it('Must delete payloads exactly at retention boundary', async () => {
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/boundary',
                status: 'sent',
            })

            // Wait exactly for retention period + 500ms to pass the boundary
            await new Promise(resolve => setTimeout(resolve, (MOCK_RETENTION_IN_SEC + 0.5) * 1000))

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(0)
        }, 10000)

        it('Must handle empty database gracefully', async () => {
            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result).toBeDefined()
            expect(typeof result.totalDeleted).toBe('number')
        })

        it('Must delete payloads in batches when count exceeds batch size', async () => {
            const payloadIds = []

            for (let i = 0; i < 5; i++) {
                const [payload] = await createTestWebhookPayload(actors.admin, {
                    url: `http://example.com/batch-${i}`,
                    status: 'sent',
                })
                payloadIds.push(payload.id)
            }

            // Wait for retention period to pass
            await new Promise(resolve => setTimeout(resolve, (MOCK_RETENTION_IN_SEC + 0.5) * 1000))

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(5)

            for (const id of payloadIds) {
                const payloadInDb = await WebhookPayload.getAll(actors.admin, { id })
                expect(payloadInDb).toHaveLength(0)
            }
        }, 10000)

        it('Must delete payloads regardless of status', async () => {
            const [pendingPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/pending',
                status: 'pending',
            })
            const [successPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/success',
                status: 'sent',
            })
            const [failedPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/failed',
                status: 'error',
            })

            // Wait for retention period to pass
            await new Promise(resolve => setTimeout(resolve, (MOCK_RETENTION_IN_SEC + 0.5) * 1000))

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(3)

            const pendingInDb = await WebhookPayload.getAll(actors.admin, { id: pendingPayload.id })
            const successInDb = await WebhookPayload.getAll(actors.admin, { id: successPayload.id })
            const failedInDb = await WebhookPayload.getAll(actors.admin, { id: failedPayload.id })

            expect(pendingInDb).toHaveLength(0)
            expect(successInDb).toHaveLength(0)
            expect(failedInDb).toHaveLength(0)
        }, 10000)

        it('Must delete soft-deleted payloads if they are old enough', async () => {
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/soft-deleted',
                status: 'sent',
            })

            await softDeleteTestWebhookPayload(actors.admin, payload.id)

            // Wait for retention period to pass
            await new Promise(resolve => setTimeout(resolve, (MOCK_RETENTION_IN_SEC + 0.5) * 1000))

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(0)
        }, 10000)
    })
}

module.exports = {
    DeleteOldWebhookPayloadsTests,
}
