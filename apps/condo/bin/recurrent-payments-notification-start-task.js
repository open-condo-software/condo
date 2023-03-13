/**
 * Start recurrent payment notification processing task
 *
 * Usage:
 *      yarn workspace @app/condo node bin/recurrent-payments-notification-start-task
 */

const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { process: processTask } = require('@condo/domains/acquiring/tasks/recurrent-payment-notification/recurrent-payment-notification')

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