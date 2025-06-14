/**
 * Load meters without submitted readings in this submitting period (this month) and sending notifications for those meters
 *
 * Usage:
 *      yarn workspace @app/condo node bin/send-submit-meter-readings-push-notifications
 */

const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

const { sendSubmitMeterReadingsPushNotifications } = require('@condo/domains/meter/tasks/sendSubmitMeterReadingsPushNotifications')


async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()


    await sendSubmitMeterReadingsPushNotifications()
    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
