const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { retryFailedWebhooksCronTask } = require('@condo/domains/common/tasks/retryFailedWebhooks')
const { sendWebhook } = require('@condo/domains/common/tasks/sendWebhook')

const logger = getLogger('simple-cron-task')

// Runs yearly
module.exports = {
    sampleTask: createCronTask('commonSampleCronTask', '0 0 1 1 *', () => {
        logger.info('common-sample-cron-task successful call')
    }),

    // Webhook delivery tasks
    retryFailedWebhooksCronTask,
    sendWebhook,
}