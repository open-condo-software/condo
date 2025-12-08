const dayjs = require('dayjs')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { WEBHOOK_PAYLOAD_RETENTION_DAYS } = require('@open-condo/webhooks/constants')
const {
    WebhookPayload,
    createTestWebhookPayload,
} = require('@open-condo/webhooks/schema/utils/testSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')


const DeleteOldWebhookPayloadsTests = (appName, actorsInitializer, entryPointPath) => {
    describe(`deleteOldWebhookPayloads task tests for ${appName} app`, () => {
        const appEntryPoint = require(entryPointPath)
        setFakeClientMode(appEntryPoint, { excludeApps: ['OIDCMiddleware'] })

        let actors
        let deleteOldWebhookPayloadsTask

        beforeAll(async () => {
            actors = await actorsInitializer()
            deleteOldWebhookPayloadsTask = getWebhookTasks().deleteOldWebhookPayloads
        })

        it('should delete old webhook payloads based on updatedAt', async () => {
            // Create an old payload (older than retention period)
            const oldDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS + 1, 'day').toISOString()
            const [oldPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'https://example.com/old-webhook',
                payload: { test: 'old' },
                secret: 'old-secret',
                eventType: 'test.old',
            })

            // Manually update the updatedAt to make it old
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayload')
                .where({ id: oldPayload.id })
                .update({ updatedAt: oldDate })

            // Create a recent payload (should not be deleted)
            const [recentPayload] = await createTestWebhookPayload(actors.admin, {
                url: 'https://example.com/recent-webhook',
                payload: { test: 'recent' },
                secret: 'recent-secret',
                eventType: 'test.recent',
            })

            // Run the cleanup task
            await deleteOldWebhookPayloadsTask.fn()

            // Old payload should be deleted
            const oldPayloadAfter = await WebhookPayload.getOne(actors.admin, { id: oldPayload.id })
            expect(oldPayloadAfter).toBeUndefined()

            // Recent payload should still exist
            const recentPayloadAfter = await WebhookPayload.getOne(actors.admin, { id: recentPayload.id })
            expect(recentPayloadAfter).toBeDefined()
            expect(recentPayloadAfter.id).toBe(recentPayload.id)

            // Cleanup
            await knex('WebhookPayload').where({ id: recentPayload.id }).del()
        })

        it('should not delete payloads within retention period', async () => {
            // Create a payload within retention period
            const [payload] = await createTestWebhookPayload(actors.admin, {
                url: 'https://example.com/webhook',
                payload: { test: 'data' },
                secret: 'secret',
                eventType: 'test.event',
            })

            // Run the cleanup task
            await deleteOldWebhookPayloadsTask.fn()

            // Payload should still exist
            const payloadAfter = await WebhookPayload.getOne(actors.admin, { id: payload.id })
            expect(payloadAfter).toBeDefined()
            expect(payloadAfter.id).toBe(payload.id)

            // Cleanup
            const { keystone } = await appEntryPoint
            const knex = keystone.adapter.knex
            await knex('WebhookPayload').where({ id: payload.id }).del()
        })
    })
}


module.exports = {
    DeleteOldWebhookPayloadsTests,
}
