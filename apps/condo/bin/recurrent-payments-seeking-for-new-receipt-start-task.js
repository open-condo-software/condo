/**
 * Start recurrent payment seeking for new billing receipts processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/recurrent-payments-seeking-for-new-receipt-start-task
 */

const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { process: processTask } = require('@condo/domains/acquiring/tasks/recurrent-payments-seeking-for-new-receipt/recurrent-payments-seeking-for-new-receipt')

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)

    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    await processTask()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})