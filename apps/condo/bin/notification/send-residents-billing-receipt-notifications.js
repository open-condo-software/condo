/**
 * Sends billing receipt added notifications
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-residents-billing-receipt-notifications
 * NOTE:
 *      - This script skips sending notifications due to due to disabled growthbook feature flag
 *      - Message schema has uniqKey constraint which is used by the script, so don't worry about duplicate notifications - for every
 *        period + accountId + receiptCategory there will be only one notification, all consequent attempts will be just skipped.
 */

const { sendBillingReceiptNotifications } = require('@condo/domains/resident/tasks/helpers')

const { connectKeystone } = require('../lib/keystone.helpers')

async function main () {
    const keystone = await connectKeystone()

    await sendBillingReceiptNotifications()

    keystone.disconnect()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })

