const dayjs = require('dayjs')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { WEBHOOK_PAYLOAD_RETENTION_DAYS } = require('@open-condo/webhooks/constants')
const { WebhookPayload, createTestWebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const DeleteOldWebhookPayloadsTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`deleteOldWebhookPayloads cron task tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

        let deleteOldWebhookPayloads
        let actors

        beforeAll(async () => {
            actors = await actorsInitializer()
            const tasks = getWebhookTasks()
            deleteOldWebhookPayloads = tasks['deleteOldWebhookPayloads']
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it('Must hard delete old webhook payloads from database', async () => {
            const now = dayjs()
            const oldPayloadsCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day')
            const recentPayloadCreatedAt = now.subtract(1, 'day')

            jest.useFakeTimers()
            jest.setSystemTime(oldPayloadsCreatedAt.toDate())
            const [oldPayload1] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old1',
                status: 'success',
            })
            const [oldPayload2] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old2',
                status: 'failed',
            })

            jest.setSystemTime(recentPayloadCreatedAt.toDate())
            const [recentPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/recent',
                status: 'success',
            })

            jest.setSystemTime(now.toDate())

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(2)

            const oldPayload1InDb = await WebhookPayload.getAll(actors.admin, { id: oldPayload1.id })
            const oldPayload2InDb = await WebhookPayload.getAll(actors.admin, { id: oldPayload2.id })
            const recentPayloadInDb = await WebhookPayload.getAll(actors.admin, { id: recentPayload.id })

            expect(oldPayload1InDb).toHaveLength(0)
            expect(oldPayload2InDb).toHaveLength(0)
            expect(recentPayloadInDb).toHaveLength(1)
            expect(recentPayloadInDb[0].id).toBe(recentPayload.id)
        })

        it('Must not delete payloads within retention period', async () => {
            const now = dayjs()
            const withinRetentionCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS - 1, 'day')

            jest.useFakeTimers()
            jest.setSystemTime(withinRetentionCreatedAt.toDate())
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/within-retention',
                status: 'success',
            })

            jest.setSystemTime(now.toDate())

            await deleteOldWebhookPayloads.delay.fn()

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(1)
            expect(payloadInDb[0].id).toBe(payload.id)
        })

        it('Must delete payloads exactly at retention boundary', async () => {
            const now = dayjs()
            const boundaryCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS, 'day').subtract(1, 'second')

            jest.useFakeTimers()
            jest.setSystemTime(boundaryCreatedAt.toDate())
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/boundary',
                status: 'success',
            })

            jest.setSystemTime(now.toDate())

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(0)
        })

        it('Must handle empty database gracefully', async () => {
            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result).toBeDefined()
            expect(typeof result.totalDeleted).toBe('number')
        })

        it('Must delete payloads in batches when count exceeds batch size', async () => {
            const now = dayjs()
            const oldCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day')
            const payloadIds = []

            jest.useFakeTimers()
            jest.setSystemTime(oldCreatedAt.toDate())
            for (let i = 0; i < 5; i++) {
                const [payload] = await createTestWebhookPayload(actors.admin, {
                    url: `http://example.com/batch-${i}`,
                    status: 'success',
                })
                payloadIds.push(payload.id)
            }

            jest.setSystemTime(now.toDate())

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(5)

            for (const id of payloadIds) {
                const payloadInDb = await WebhookPayload.getAll(actors.admin, { id })
                expect(payloadInDb).toHaveLength(0)
            }
        })

        it('Must delete payloads regardless of status', async () => {
            const now = dayjs()
            const oldCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day')

            jest.useFakeTimers()
            jest.setSystemTime(oldCreatedAt.toDate())
            const [pendingPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/pending',
                status: 'pending',
            })
            const [successPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/success',
                status: 'success',
            })
            const [failedPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/failed',
                status: 'failed',
            })

            jest.setSystemTime(now.toDate())

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(3)

            const pendingInDb = await WebhookPayload.getAll(actors.admin, { id: pendingPayload.id })
            const successInDb = await WebhookPayload.getAll(actors.admin, { id: successPayload.id })
            const failedInDb = await WebhookPayload.getAll(actors.admin, { id: failedPayload.id })

            expect(pendingInDb).toHaveLength(0)
            expect(successInDb).toHaveLength(0)
            expect(failedInDb).toHaveLength(0)
        })

        it('Must delete soft-deleted payloads if they are old enough', async () => {
            const now = dayjs()
            const oldCreatedAt = now.subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day')

            jest.useFakeTimers()
            jest.setSystemTime(oldCreatedAt.toDate())
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/soft-deleted',
                status: 'success',
            })

            await actors.admin.softDelete(payload.id)

            jest.setSystemTime(now.toDate())

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(0)
        })
    })
}

module.exports = {
    DeleteOldWebhookPayloadsTests,
}
