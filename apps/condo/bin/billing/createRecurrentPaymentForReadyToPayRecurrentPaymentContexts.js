/**
 * Start recurrent payment context processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/createRecurrentPaymentForReadyToPayRecurrentPaymentContexts
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const {
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
} = require('@condo/domains/acquiring/tasks/createRecurrentPaymentForReadyToPayRecurrentPaymentContexts')

async function main () {
    await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp'] },
    )

    await createRecurrentPaymentForReadyToPayRecurrentPaymentContexts()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
