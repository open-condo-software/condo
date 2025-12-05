const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { retryFailedWebhookPayloadsCronTask } = require('@condo/domains/common/tasks/retryFailedWebhookPayloads')
const { sendWebhookPayload } = require('@condo/domains/common/tasks/sendWebhookPayload')

const logger = getLogger('simple-cron-task')

// Runs yearly
module.exports = {
    sampleTask: createCronTask('commonSampleCronTask', '0 0 1 1 *', () => {
        logger.info('common-sample-cron-task successful call')
    }),

    // Webhook payload tasks
    retryFailedWebhookPayloadsCronTask,
    sendWebhookPayload,
}