const isEmpty = require('lodash/isEmpty')

const { PUSH_TRANSPORT_FIREBASE, PUSH_TRANSPORT_REDSTORE, PUSH_TRANSPORT_HUAWEI, PUSH_TRANSPORT_APPLE,
    PUSH_TRANSPORT_WEBHOOK, PUSH_TRANSPORT_TYPES,
} = require('@condo/domains/notification/constants/constants')

/**
 * Prepares conditions
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {{deletedAt: null, pushToken_not?: null, pushTransport_in?: [string, string, string]}|{deletedAt: null, pushTokenVoIP_not?: null, pushTransportVoIP_in?: [string, string, string]}}
 */
function getTokensConditions (ownerId, remoteClientId, isVoIP) {
    const conditions = {
        deletedAt: null,
    }

    if (ownerId) conditions.owner = { id: ownerId }
    if (remoteClientId) conditions.id_in = [remoteClientId]

    if (isVoIP) {
        conditions.pushTokenVoIP_not = null
        conditions.pushTransportVoIP_in = PUSH_TRANSPORT_TYPES
    } else {
        conditions.pushToken_not =  null
        conditions.pushTransport_in = PUSH_TRANSPORT_TYPES
    }

    return conditions
}

/**
 * Request push tokens for user. Able to detect FireBase/Huawei and different appId versions. isVoIP flag is used to substitute VoIP pushToken, pushType and pushTransport fields.
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {Promise<{tokensByTransport: {[p: string]: [], '[PUSH_TRANSPORT_HUAWEI]': *[], '[PUSH_TRANSPORT_APPLE]': *[], '[PUSH_TRANSPORT_FIREBASE]': *[]}, appIds: {}, pushTypes: {}, count}|*[]>}
 */
async function getTokens (ownerId, remoteClientId, isVoIP = false) {
    if (!ownerId && !remoteClientId) return []

    const conditions = getTokensConditions(ownerId, remoteClientId, isVoIP)
    const remoteClients =  await find('RemoteClient', conditions)
    const tokensByTransport = {
        [PUSH_TRANSPORT_FIREBASE]: [],
        [PUSH_TRANSPORT_REDSTORE]: [],
        [PUSH_TRANSPORT_HUAWEI]: [],
        [PUSH_TRANSPORT_APPLE]: [],
        [PUSH_TRANSPORT_WEBHOOK]: [],
    }
    const pushTypes = {}
    const appIds = {}
    const metaByToken = {}

    if (!isEmpty(remoteClients)) {
        remoteClients.forEach((remoteClient) => {
            const {
                appId, pushToken, pushType, pushTransport,
                pushTokenVoIP, pushTypeVoIP, pushTransportVoIP,
                meta,
            } = remoteClient
            const transport = isVoIP ? pushTransportVoIP : pushTransport
            const token = isVoIP ? pushTokenVoIP : pushToken
            const type = isVoIP ? pushTypeVoIP : pushType

            tokensByTransport[transport].push(token)
            pushTypes[token] = type
            appIds[token] = appId
            metaByToken[token] = meta
        })
    }

    return { tokensByTransport, pushTypes, appIds, metaByToken, count: remoteClients.length }
}

module.exports = {
    getTokens,
}