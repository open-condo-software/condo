/**
 * Sends notifications to devices that have old style (before release 2.0.0) app, that is incompatible with current API
 */

const { sendRemoteClientsUpgradeAppNotifications } = require('@condo/domains/notification/helpers')

const { connectKeystone } = require('../lib/keystone.helpers')

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

