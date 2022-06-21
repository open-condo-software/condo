/**
 * Sends billing receipt added notifications
 *
 * Usage:
 *      yarn workspace @app/condo node bin/send-receipt-added-notifications [<RESEND_FROM_DATETIME>]
 * NOTE:
 *      - RESEND_FROM_DATETIME - script stores last successfully proceeded receipt createdAt in Redis, and every next execution starts
 *        proceeding receipts created exactly after that time. If something have been missed, you can force script to start from any arbitrary
 *        time formatted as YYYY-MM-DDTHH:mm:ss.NNNNN+TZ
 *      - Message schema has uniqKey constraint which is used by the script, so don't worry about duplicate notifications - for every
 *        period + accountId + receiptCategory there will be only one notification, all consequent attempts will be just skipped.
 */

const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const { sendBillingReceiptsAddedNotifications } = require('@condo/domains/resident/tasks/index')

async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

async function main () {
    await connectKeystone()

    const resendFromDt = process.argv[2]

    await sendBillingReceiptsAddedNotifications(resendFromDt)
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })

