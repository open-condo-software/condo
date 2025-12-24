const dayjs = require('dayjs')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { WEBHOOK_PAYLOAD_RETENTION_DAYS } = require('@open-condo/webhooks/constants')
const { WebhookPayload, createTestWebhookPayload, softDeleteTestWebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const DeleteOldWebhookPayloadsTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`deleteOldWebhookPayloads cron task tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

        let deleteOldWebhookPayloads
        let actors
        let knex

        beforeAll(async () => {
            actors = await actorsInitializer()
            const tasks = getWebhookTasks()
            deleteOldWebhookPayloads = tasks['deleteOldWebhookPayloads']
            const { keystone } = getSchemaCtx('WebhookPayload')
            knex = keystone.adapter.knex
        })

        async function setPayloadUpdatedAt (payloadId, updatedAt) {
            await knex('WebhookPayload').where({ id: payloadId }).update({ updatedAt })
        }

        it('Must hard delete old webhook payloads from database', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            const recentDate = dayjs().subtract(1, 'day').toISOString()

            const [oldPayload1] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old1',
                status: 'sent',
            })
            const [oldPayload2] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old2',
                status: 'error',
            })
            const [recentPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/recent',
                status: 'sent',
            })

            await setPayloadUpdatedAt(oldPayload1.id, oldDate)
            await setPayloadUpdatedAt(oldPayload2.id, oldDate)
            await setPayloadUpdatedAt(recentPayload.id, recentDate)

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
            const withinRetentionDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS - 1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/within-retention',
                status: 'sent',
            })

            await setPayloadUpdatedAt(payload.id, withinRetentionDate)

            await deleteOldWebhookPayloads.delay.fn()

            const payloadInDb = await WebhookPayload.getAll(actors.admin, { id: payload.id })

            expect(payloadInDb).toHaveLength(1)
            expect(payloadInDb[0].id).toBe(payload.id)
        })

        it('Must delete payloads exactly at retention boundary', async () => {
            const boundaryDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS, 'day').subtract(1, 'second').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/boundary',
                status: 'sent',
            })

            await setPayloadUpdatedAt(payload.id, boundaryDate)

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
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            const payloadIds = []

            for (let i = 0; i < 5; i++) {
                const [payload] = await createTestWebhookPayload(actors.admin, {
                    url: `http://example.com/batch-${i}`,
                    status: 'sent',
                })
                await setPayloadUpdatedAt(payload.id, oldDate)
                payloadIds.push(payload.id)
            }

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(5)

            for (const id of payloadIds) {
                const payloadInDb = await WebhookPayload.getAll(actors.admin, { id })
                expect(payloadInDb).toHaveLength(0)
            }
        })

        it('Must delete payloads regardless of status', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()

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

            await setPayloadUpdatedAt(pendingPayload.id, oldDate)
            await setPayloadUpdatedAt(successPayload.id, oldDate)
            await setPayloadUpdatedAt(failedPayload.id, oldDate)

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
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/soft-deleted',
                status: 'sent',
            })

            await softDeleteTestWebhookPayload(actors.admin, payload.id)

            await setPayloadUpdatedAt(payload.id, oldDate)

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
