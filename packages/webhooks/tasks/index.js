const { sendWebhook } = require('@condo/webhooks/tasks/sendWebhook')
const { sendModelWebhooks } = require('@condo/webhooks/tasks/sendModelWebhooks')

module.exports = {
    sendWebhook,
    sendModelWebhooks,
}