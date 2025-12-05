const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')
const { getWebhookTasks, getRetryFailedWebhookPayloadsCronTask } = require('@open-condo/webhooks/tasks')

const logger = getLogger('simple-cron-task')

// Webhook tasks from @open-condo/webhooks package
const { sendWebhookPayload } = getWebhookTasks()
const retryFailedWebhookPayloadsCronTask = getRetryFailedWebhookPayloadsCronTask()

// Runs yearly
module.exports = {
    sampleTask: createCronTask('commonSampleCronTask', '0 0 1 1 *', () => {
        logger.info('common-sample-cron-task successful call')
    }),

    // Webhook payload tasks from @open-condo/webhooks package
    retryFailedWebhookPayloadsCronTask,
    sendWebhookPayload,
}