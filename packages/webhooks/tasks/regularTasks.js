const { DEFAULT_QUEUE_NAME, createTask } = require('@open-condo/keystone/tasks')
const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')
const { sendWebhookPayload } = require('@open-condo/webhooks/tasks/sendWebhookPayload')

const REGULAR_TASKS_CACHE = new Map()

function getWebhookRegularTasks (taskPriority = DEFAULT_QUEUE_NAME) {
    if (!REGULAR_TASKS_CACHE.has('sendWebhook')) {
        REGULAR_TASKS_CACHE.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
    }
    if (!REGULAR_TASKS_CACHE.has('sendModelWebhooks')) {
        REGULAR_TASKS_CACHE.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }
    if (!REGULAR_TASKS_CACHE.has('sendWebhookPayload')) {
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
