/**
 * Start recurrent payment processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/chargeRecurrentPayments
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const {
    chargeRecurrentPayments,
} = require('@condo/domains/acquiring/tasks/chargeRecurrentPayments')

async function main () {
    await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp'] },
    )

    await chargeRecurrentPayments()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
