/**
 * Sends billing receipt added notifications
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-residents-no-account-notifications [<PERIOD>] [<BILLING_CONTEXT_ID>] [<RESEND_FROM_DATETIME>]
 * NOTE:
 *      - PERIOD - ex.: 2022-06-01 - if skipped, current month start will be taken
 *      - BILLING_CONTEXT_ID - id of record from BillingIntegrationOrganizationContext with status = Finished, if skipped (use _ to skip), all available contexts will be proceeded
 *      - RESEND_FROM_DATETIME - script stores last process start datetime in Redis, and every next execution starts
 *        proceeding receipts created exactly after that time. If something have been missed, you can force script to start from any arbitrary
 *        time formatted as YYYY-MM-DDTHH:mm:ss.NNNNN+TZ
 *      - Message schema has uniqKey constraint which is used by the script, so don't worry about duplicate notifications - for every
 *        period + propertyId + residentId there will be only one notification, all consequent attempts will be just skipped.
 */

const path = require('path')
const { get } = require('lodash')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const { sendResidentsNoAccountNotificationsForPeriod } = require('@condo/domains/resident/tasks/index')

async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

const checkBillingContext = context => get(context, 'length') >= 36 ? context : undefined

async function main () {
    const keystone = await connectKeystone()
    const period = process.argv[2]
    const billingContextId = checkBillingContext(process.argv[3])
    const resendFromDt = process.argv[4]

    await sendResidentsNoAccountNotificationsForPeriod(period, billingContextId, resendFromDt)

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

