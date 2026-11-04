const conf = require('@open-condo/config')

const DEFAULT_WEBHOOK_SYNC_DELAY_IN_MS = 50

const configuredWebhookSyncDelay = Number(conf['WEBHOOK_SYNC_DELAY_IN_MS'])
const WEBHOOK_SYNC_DELAY_IN_MS = Number.isFinite(configuredWebhookSyncDelay) && configuredWebhookSyncDelay > 0
    ? configuredWebhookSyncDelay
    : DEFAULT_WEBHOOK_SYNC_DELAY_IN_MS

module.exports = {
    WEBHOOK_SYNC_DELAY_IN_MS,
}
