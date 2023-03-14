/**
 * Start recurrent payment notification processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/recurrent-payments-notification-start-task
 */

const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { process: processTask } = require('@condo/domains/acquiring/tasks/recurrent-payments-notification/recurrent-payments-notification')

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