const { DEFAULT_QUEUE_NAME, createTask } = require('@open-condo/keystone/tasks')
const { Webhook } = require('@open-condo/webhooks/schema/models/Webhook')
const { getWebhookSubscriptionModel } = require('@open-condo/webhooks/schema/models/WebhookSubscription')
const { sendModelWebhooks, sendWebhook } = require('@open-condo/webhooks/tasks')

const WEBHOOK_TASKS = new Map()


function getWebhookModels (schemaPath) {
    return {
        Webhook,
        WebhookSubscription: getWebhookSubscriptionModel(schemaPath),
    }
}

function getWebhookTasks (taskPriority = DEFAULT_QUEUE_NAME) {
    if (WEBHOOK_TASKS.size === 0) {
        WEBHOOK_TASKS.set('sendWebhook', createTask('sendWebHook', sendWebhook, taskPriority))
        WEBHOOK_TASKS.set('sendModelWebhooks', createTask('sendModelWebhooks', sendModelWebhooks, taskPriority))
    }

    return {
        sendWebhook: WEBHOOK_TASKS.get('sendWebhook'),
        sendModelWebhooks: WEBHOOK_TASKS.get('sendModelWebhooks'),
    }
}

module.exports = {
    getWebhookModels,
    getWebhookTasks,
}
