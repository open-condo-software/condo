const { DEFAULT_QUEUE_NAME, createTask, createCronTask } = require('@open-condo/keystone/tasks')
const { retryFailedWebhookPayloads } = require('@open-condo/webhooks/tasks/retryFailedWebhookPayloads')
const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')
const { sendWebhookPayload } = require('@open-condo/webhooks/tasks/sendWebhookPayload')

const WEBHOOK_TASKS = new Map()

function getWebhookTasks (taskPriority = DEFAULT_QUEUE_NAME) {
    if (!WEBHOOK_TASKS.has('sendWebhook')) {
        WEBHOOK_TASKS.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
    }
    if (!WEBHOOK_TASKS.has('sendModelWebhooks')) {
        WEBHOOK_TASKS.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }
    if (!WEBHOOK_TASKS.has('sendWebhookPayload')) {
        WEBHOOK_TASKS.set('sendWebhookPayload', createTask('sendWebhookPayload', sendWebhookPayload, taskPriority))
    }

    return {
        sendWebhook: WEBHOOK_TASKS.get('sendWebhook'),
        sendModelWebhooks: WEBHOOK_TASKS.get('sendModelWebhooks'),
        sendWebhookPayload: WEBHOOK_TASKS.get('sendWebhookPayload'),
    }
}

/**
 * Creates a cron task for retrying failed webhook payloads
 * @param {string} cronSchedule - Cron schedule expression (default: every 5 minutes)
 * @returns {Object} Cron task object
 */
function getRetryFailedWebhookPayloadsCronTask (cronSchedule = '*/5 * * * *') {
    const { sendWebhookPayload: sendWebhookPayloadTask } = getWebhookTasks()
    return createCronTask(
        'retryFailedWebhookPayloads',
        cronSchedule,
        () => retryFailedWebhookPayloads(sendWebhookPayloadTask)
    )
}

module.exports = {
    getWebhookTasks,
    getRetryFailedWebhookPayloadsCronTask,
}
