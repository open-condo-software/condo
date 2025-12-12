const { DEFAULT_QUEUE_NAME, createTask, createCronTask } = require('@open-condo/keystone/tasks')
const { deleteOldWebhookPayloads } = require('@open-condo/webhooks/tasks/deleteOldWebhookPayloads')
const { retryFailedWebhookPayloads } = require('@open-condo/webhooks/tasks/retryFailedWebhookPayloads')
const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')
const { sendWebhookPayload } = require('@open-condo/webhooks/tasks/sendWebhookPayload')

const WEBHOOK_TASKS = new Map()

/**
 * Gets all webhook tasks including regular tasks and cron tasks
 * @param {string} taskPriority - Task queue priority (default: DEFAULT_QUEUE_NAME)
 * @param {Object} cronSchedules - Optional cron schedule overrides
 * @returns {Object} Object containing all webhook tasks
 */
function getWebhookTasks (taskPriority = DEFAULT_QUEUE_NAME, cronSchedules = {}) {
    const {
        retryFailedWebhookPayloads: retrySchedule = '*/1 * * * *',
        deleteOldWebhookPayloads: deleteSchedule = '0 3 * * *',
    } = cronSchedules

    // Regular tasks
    if (!WEBHOOK_TASKS.has('sendWebhook')) {
        WEBHOOK_TASKS.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
    }
    if (!WEBHOOK_TASKS.has('sendModelWebhooks')) {
        WEBHOOK_TASKS.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }
    if (!WEBHOOK_TASKS.has('sendWebhookPayload')) {
        WEBHOOK_TASKS.set('sendWebhookPayload', createTask('sendWebhookPayload', sendWebhookPayload, taskPriority))
    }

    // Cron tasks
    if (!WEBHOOK_TASKS.has('retryFailedWebhookPayloads')) {
        WEBHOOK_TASKS.set('retryFailedWebhookPayloads', createCronTask(
            'retryFailedWebhookPayloads',
            retrySchedule,
            retryFailedWebhookPayloads
        ))
    }
    if (!WEBHOOK_TASKS.has('deleteOldWebhookPayloads')) {
        WEBHOOK_TASKS.set('deleteOldWebhookPayloads', createCronTask(
            'deleteOldWebhookPayloads',
            deleteSchedule,
            deleteOldWebhookPayloads
        ))
    }

    return {
        sendWebhook: WEBHOOK_TASKS.get('sendWebhook'),
        sendModelWebhooks: WEBHOOK_TASKS.get('sendModelWebhooks'),
        sendWebhookPayload: WEBHOOK_TASKS.get('sendWebhookPayload'),
        retryFailedWebhookPayloads: WEBHOOK_TASKS.get('retryFailedWebhookPayloads'),
        deleteOldWebhookPayloads: WEBHOOK_TASKS.get('deleteOldWebhookPayloads'),
    }
}

module.exports = {
    getWebhookTasks,
}
