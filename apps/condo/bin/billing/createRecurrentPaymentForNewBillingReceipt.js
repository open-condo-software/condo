/**
 * Start recurrent payment seeking for new billing receipts processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/billing/createRecurrentPaymentForNewBillingReceipt
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const {
    createRecurrentPaymentForNewBillingReceipt,
} = require('@condo/domains/acquiring/tasks/createRecurrentPaymentForNewBillingReceipt')

async function main () {
    await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp'] },
    )

    await createRecurrentPaymentForNewBillingReceipt()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
