const { isEmpty } = require('lodash')

/**
 * Sends incoming VoIP call notification
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-incoming-voip-call-notification <USER_ID> <B2C_APP_ID> <CALL_ID>
 */

const { sendIncomingVoIPCallNotification } = require('@condo/domains/notification/helpers')

const { connectKeystone } = require('../lib/keystone.helpers')

async function main () {
    const keystone = await connectKeystone()
    const userId = process.argv[2]
    const B2CAppId = process.argv[3]
    const callId = process.argv[4]
    const extraAttrs = process.argv.slice(5)

    if (!isEmpty(extraAttrs)) console.info('Extra attrs will be omitted:', extraAttrs)

    await sendIncomingVoIPCallNotification({ userId, B2CAppId, callId })

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

