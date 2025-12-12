const dayjs = require('dayjs')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { WEBHOOK_PAYLOAD_RETENTION_DAYS } = require('@open-condo/webhooks/constants')
const { createTestWebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
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

        it('Must hard delete old webhook payloads from database', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            const recentDate = dayjs().subtract(1, 'day').toISOString()

            const [oldPayload1] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old1',
                status: 'success',
            })
            const [oldPayload2] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/old2',
                status: 'failed',
            })
            const [recentPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/recent',
                status: 'success',
            })

            await knex('WebhookPayload').where({ id: oldPayload1.id }).update({ updatedAt: oldDate })
            await knex('WebhookPayload').where({ id: oldPayload2.id }).update({ updatedAt: oldDate })
            await knex('WebhookPayload').where({ id: recentPayload.id }).update({ updatedAt: recentDate })

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(2)

            const oldPayload1InDb = await knex('WebhookPayload').where({ id: oldPayload1.id }).first()
            const oldPayload2InDb = await knex('WebhookPayload').where({ id: oldPayload2.id }).first()
            const recentPayloadInDb = await knex('WebhookPayload').where({ id: recentPayload.id }).first()

            expect(oldPayload1InDb).toBeUndefined()
            expect(oldPayload2InDb).toBeUndefined()
            expect(recentPayloadInDb).toBeDefined()
            expect(recentPayloadInDb.id).toBe(recentPayload.id)
        })

        it('Must hard delete old webhook payload history records', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/history-test',
                status: 'pending',
            })

            await knex('WebhookPayload')
                .where({ id: payload.id })
                .update({ status: 'success' })

            await knex('WebhookPayloadHistoryRecord')
                .where({ history_id: payload.id })
                .update({ updatedAt: oldDate })

            const historyCountBefore = await knex('WebhookPayloadHistoryRecord')
                .where({ history_id: payload.id })
                .count('* as count')
                .first()

            expect(parseInt(historyCountBefore.count)).toBeGreaterThan(0)

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalHistoryDeleted).toBeGreaterThanOrEqual(parseInt(historyCountBefore.count))

            const historyCountAfter = await knex('WebhookPayloadHistoryRecord')
                .where({ history_id: payload.id })
                .count('* as count')
                .first()

            expect(parseInt(historyCountAfter.count)).toBe(0)
        })

        it('Must not delete payloads within retention period', async () => {
            const withinRetentionDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS - 1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/within-retention',
                status: 'success',
            })

            await knex('WebhookPayload').where({ id: payload.id }).update({ updatedAt: withinRetentionDate })

            await deleteOldWebhookPayloads.delay.fn()

            const payloadInDb = await knex('WebhookPayload').where({ id: payload.id }).first()

            expect(payloadInDb).toBeDefined()
            expect(payloadInDb.id).toBe(payload.id)
        })

        it('Must delete payloads exactly at retention boundary', async () => {
            const boundaryDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS, 'day').subtract(1, 'second').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/boundary',
                status: 'success',
            })

            await knex('WebhookPayload').where({ id: payload.id }).update({ updatedAt: boundaryDate })

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await knex('WebhookPayload').where({ id: payload.id }).first()

            expect(payloadInDb).toBeUndefined()
        })

        it('Must handle empty database gracefully', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            
            await knex('WebhookPayload')
                .whereRaw('"updatedAt" < ?', [oldDate])
                .del()
            await knex('WebhookPayloadHistoryRecord')
                .whereRaw('"updatedAt" < ?', [oldDate])
                .del()

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result).toBeDefined()
            expect(result.totalDeleted).toBe(0)
            expect(result.totalHistoryDeleted).toBe(0)
        })

        it('Must delete payloads in batches when count exceeds batch size', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            const payloadIds = []

            for (let i = 0; i < 5; i++) {
                const [payload] = await createTestWebhookPayload(actors.admin, {
                    url: `http://example.com/batch-${i}`,
                    status: 'success',
                })
                await knex('WebhookPayload').where({ id: payload.id }).update({ updatedAt: oldDate })
                payloadIds.push(payload.id)
            }

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(5)

            for (const id of payloadIds) {
                const payloadInDb = await knex('WebhookPayload').where({ id }).first()
                expect(payloadInDb).toBeUndefined()
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
                status: 'success',
            })
            const [failedPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/failed',
                status: 'failed',
            })

            await knex('WebhookPayload').where({ id: pendingPayload.id }).update({ updatedAt: oldDate })
            await knex('WebhookPayload').where({ id: successPayload.id }).update({ updatedAt: oldDate })
            await knex('WebhookPayload').where({ id: failedPayload.id }).update({ updatedAt: oldDate })

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(3)

            const pendingInDb = await knex('WebhookPayload').where({ id: pendingPayload.id }).first()
            const successInDb = await knex('WebhookPayload').where({ id: successPayload.id }).first()
            const failedInDb = await knex('WebhookPayload').where({ id: failedPayload.id }).first()

            expect(pendingInDb).toBeUndefined()
            expect(successInDb).toBeUndefined()
            expect(failedInDb).toBeUndefined()
        })

        it('Must delete soft-deleted payloads if they are old enough', async () => {
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()

            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'http://example.com/soft-deleted',
                status: 'success',
            })

            await knex('WebhookPayload')
                .where({ id: payload.id })
                .update({ deletedAt: oldDate, updatedAt: oldDate })

            const result = await deleteOldWebhookPayloads.delay.fn()

            expect(result.totalDeleted).toBeGreaterThanOrEqual(1)

            const payloadInDb = await knex('WebhookPayload').where({ id: payload.id }).first()

            expect(payloadInDb).toBeUndefined()
        })
    })
}

module.exports = {
    DeleteOldWebhookPayloadsTests,
}
