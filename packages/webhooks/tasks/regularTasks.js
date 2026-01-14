const { DEFAULT_QUEUE_NAME, createTask } = require('@open-condo/keystone/tasks')

const REGULAR_TASKS_CACHE = new Map()

function getWebhookRegularTasks (taskPriority = DEFAULT_QUEUE_NAME) {
    if (!REGULAR_TASKS_CACHE.has('sendWebhook')) {
        // Lazy import to prevent side effects at module load time and avoid test pollution
        const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')
        REGULAR_TASKS_CACHE.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
    }
    if (!REGULAR_TASKS_CACHE.has('sendModelWebhooks')) {
        // Lazy import to prevent side effects at module load time and avoid test pollution
        const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
        REGULAR_TASKS_CACHE.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }
    if (!REGULAR_TASKS_CACHE.has('sendWebhookPayload')) {
        // Lazy import to prevent side effects at module load time and avoid test pollution
        const { sendWebhookPayload } = require('@open-condo/webhooks/tasks/sendWebhookPayload')
        REGULAR_TASKS_CACHE.set('sendWebhookPayload', createTask('sendWebhookPayload', sendWebhookPayload, taskPriority))
    }

    return {
        sendWebhook: REGULAR_TASKS_CACHE.get('sendWebhook'),
        sendModelWebhooks: REGULAR_TASKS_CACHE.get('sendModelWebhooks'),
        sendWebhookPayload: REGULAR_TASKS_CACHE.get('sendWebhookPayload'),
    }
}

module.exports = {
    getWebhookRegularTasks,
}
