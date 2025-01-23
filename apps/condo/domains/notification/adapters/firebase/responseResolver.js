const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging/getLogger')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')

const { RemoteClient } = require('@condo/domains/notification/utils/serverSchema')


const logger = getLogger('firebaseResponseResolver')

const responseResolver = async (result, isVoIP) => {
    const responses = get(result, 'responses', [])
    if (responses && responses.length) {
        for (const response of responses) {
            const context = getSchemaCtx('RemoteClient')
            if (get(response, 'error.code') === 'messaging/registration-token-not-registered') {
                const field = isVoIP ? 'pushTokenVoIP' : 'pushToken'
                const pushToken = get(response, 'pushToken')
                
                if (!pushToken) {
                    logger.warn({ msg: 'pushToken not provided', response })
                    continue
                }
                
                const [remoteClient] = await find('RemoteClient', {
                    [field]: response.pushToken,
                    deletedAt: null,
                })
                if (!remoteClient) {
                    logger.warn({ msg: 'remoteClient not found by pushToken', pushToken: response.pushToken })
                    continue
                }

                const remoteClientId = get(remoteClient, 'id')
                if (remoteClientId) {
                    await RemoteClient.update(context, remoteClientId, {
                        [field]: null,
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'internal-update_token-not-registered' },
                    })
                    logger.info({ msg: 'Remove expired FCM token', remoteClientId, field })
                }
            }
        }
    }
}

module.exports = {
    responseResolver,
}
