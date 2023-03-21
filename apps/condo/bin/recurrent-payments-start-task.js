/**
 * Start recurrent payment processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/recurrent-payments-start-task
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const {
    processReadyToChargeRecurrentPayments,
} = require('@condo/domains/acquiring/tasks/recurrent-payment-processing')

async function main () {
    await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp'] },
    )

    await processReadyToChargeRecurrentPayments()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})