/**
 * Sends notifications to devices that have old style (before release 2.0.0) app, that is incompatible with current API
 */
const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')

const { sendRemoteClientsUpgradeAppNotifications } = require('@condo/domains/notification/tasks/index')

async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

async function main () {
    const keystone = await connectKeystone()

    await sendRemoteClientsUpgradeAppNotifications()

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

