const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')
const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')

module.exports = {
    sendWebhook,
    sendModelWebhooks,
}