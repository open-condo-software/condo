/**
 * Start recurrent payment context processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/recurrent-payments-context-start-task
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { process: processTask } = require('@condo/domains/acquiring/tasks/recurrent-payment-context-processing')

async function main () {
    await prepareKeystoneExpressApp(
        path.resolve('./index.js'),
        { excludeApps: ['NextApp'] },
    )

    await processTask()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})