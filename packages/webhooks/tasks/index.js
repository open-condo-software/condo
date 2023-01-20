const { sendModelWebhooks } = require('@open-condo/webhooks/tasks/sendModelWebhooks')
const { sendWebhook } = require('@open-condo/webhooks/tasks/sendWebhook')

module.exports = {
    sendWebhook,
    sendModelWebhooks,
}