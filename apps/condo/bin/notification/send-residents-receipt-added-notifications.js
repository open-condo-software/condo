/**
 * Sends billing receipt added notifications
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-receipt-added-notifications [<RESEND_FROM_DATETIME>]
 * NOTE:
 *      - RESEND_FROM_DATETIME - script stores last successfully proceeded receipt createdAt in Redis, and every next execution starts
 *        proceeding receipts created exactly after that time. If something have been missed, you can force script to start from any arbitrary
 *        time formatted as YYYY-MM-DDTHH:mm:ss.NNNNN+TZ
 *      - Message schema has uniqKey constraint which is used by the script, so don't worry about duplicate notifications - for every
 *        period + accountId + receiptCategory there will be only one notification, all consequent attempts will be just skipped.
 */

const path = require('path')
//const { sendBillingReceiptsAddedNotifications } = require('@condo/domains/resident/tasks/helpers')

const { prepareKeystoneExpressApp } = require('@condo/keystone/test.utils')

async function main () {
    const excludeApps = [
        'VersioningMiddleware',
        'OIDCMiddleware',
        'FeaturesMiddleware',
        'OBSFilesMiddleware',
        'SberBuisnessOnlineMiddleware',
        'AdminUIApp',
        'NextApp',
    ]

    console.log('pr:', path.resolve('./index.js'))

    const { keystone } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps })

    // const resendFromDt = process.argv[2]

    // await sendBillingReceiptsAddedNotifications(resendFromDt)

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

