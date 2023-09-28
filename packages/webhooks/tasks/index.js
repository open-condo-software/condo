const { createTask } = require('@open-condo/keystone/tasks')

const { sendModelWebhooks } = require('./sendModelWebhooks')
const { sendWebhook } = require('./sendWebhook')

module.exports = {
    sendWebhookTask: createTask('sendWebHook', sendWebhook, { priority: 2 }),
    sendModelWebhooksTask: createTask('sendModelWebhooks', sendModelWebhooks, { priority: 3 }),
}