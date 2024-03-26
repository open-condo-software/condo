const { DEFAULT_QUEUE_NAME, createTask } = require('@open-condo/keystone/tasks')
const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')

const WEBHOOK_TASKS = new Map()

function getWebhookTasks (taskPriority = DEFAULT_QUEUE_NAME) {
    if (!WEBHOOK_TASKS.has('sendWebhook')) {
        WEBHOOK_TASKS.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
    }
    if (!WEBHOOK_TASKS.has('sendModelWebhooks')) {
        WEBHOOK_TASKS.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }

    return {
        sendWebhook: WEBHOOK_TASKS.get('sendWebhook'),
        sendModelWebhooks: WEBHOOK_TASKS.get('sendModelWebhooks'),
    }
}

module.exports = {
    getWebhookTasks,
}
