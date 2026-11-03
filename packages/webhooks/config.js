const conf = require('@open-condo/config')

const DEFAULT_WEBHOOK_SYNC_DELAY_IN_SEC = 1

const configuredWebhookSyncDelay = Number(conf['WEBHOOK_SYNC_DELAY_IN_SEC'])
const WEBHOOK_SYNC_DELAY_IN_SEC = Number.isFinite(configuredWebhookSyncDelay) && configuredWebhookSyncDelay > 0
    ? configuredWebhookSyncDelay
    : DEFAULT_WEBHOOK_SYNC_DELAY_IN_SEC

module.exports = {
    WEBHOOK_SYNC_DELAY_IN_SEC,
}
