const { find } = require('@open-condo/keystone/schema')

const {
    REMOTE_CLIENT_GROUP_UNGROUPED, PUSH_TRANSPORT_FIREBASE, PUSH_TRANSPORT_APPLE, PUSH_TRANSPORT_REDSTORE,
    PUSH_TRANSPORT_HUAWEI, PUSH_TRANSPORT_ONESIGNAL, PUSH_TRANSPORT_WEBHOOK,
} = require('@condo/domains/notification/constants/constants')

const DEFAULT_TRANSPORT_PRIORITY = [PUSH_TRANSPORT_FIREBASE, PUSH_TRANSPORT_APPLE, PUSH_TRANSPORT_REDSTORE, PUSH_TRANSPORT_HUAWEI, PUSH_TRANSPORT_ONESIGNAL, PUSH_TRANSPORT_WEBHOOK]


/**
 * @typedef TokensData
 * @type {{tokensByTransport: {[p: string]: [], '[PUSH_TRANSPORT_HUAWEI]': *[], '[PUSH_TRANSPORT_APPLE]': *[], '[PUSH_TRANSPORT_FIREBASE]': *[]}, appIds: {}, pushTypes: {}, count}|*[]}
 */

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

    return conditions
}

function isRecipientValid (recipient) {
    return recipient.token && recipient.transport && recipient.appId
}

/**
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @param transportPriorityByAppId
 * @returns {Promise<{appId, token, transport, pushType, remoteClientMeta}[]>}
 */
async function getTokens (ownerId, remoteClientId, isVoIP = false, transportPriorityByAppId = {}) {
    if (!ownerId && !remoteClientId) return []

    const conditions = getTokensConditions(ownerId, remoteClientId, isVoIP)
    const remoteClients =  await find('RemoteClient', conditions)
    const remoteClientById = Object.fromEntries(remoteClients.map(rc => ([rc.id, rc])))

    const remoteClientPushTokens = await find('RemoteClientPushToken', {
        remoteClient: { id_in: remoteClients.map(rc => rc.id) },
        deletedAt: null,
        ...isVoIP ? { isVoIP: true } : { isPush: true },
    })

    const recipientsByTransportAndToken = remoteClients
        .map(remoteClient => ({
            appId: remoteClient.appId,
            token: isVoIP ? remoteClient.pushTokenVoIP : remoteClient.pushToken,
            transport: isVoIP ? remoteClient.pushTransportVoIP : remoteClient.pushTransport,
            pushType: isVoIP ? remoteClient.pushTypeVoIP : remoteClient.pushType,
            remoteClientMeta: remoteClient.meta,
            remoteClientId: remoteClient.id,
        })).concat(
            remoteClientPushTokens.map(pushToken => ({
                appId: remoteClientById[pushToken.remoteClient].appId,
                token: pushToken.token,
                transport: pushToken.provider,
                pushType: remoteClientById[pushToken.remoteClient][isVoIP ? 'pushTypeVoIP' : 'pushType'],
                remoteClientMeta: remoteClientById[pushToken.remoteClient].meta,
                remoteClientId: pushToken.remoteClient,
            }))
        ).filter(recipient => isRecipientValid(recipient))
        .reduce((byTransportAndToken, recipient) => {
            byTransportAndToken[`${recipient.transport}:${recipient.token}`] = recipient
            return byTransportAndToken
        })

    const recipients = Object.values(recipientsByTransportAndToken)

    // NOTE(YEgorLu): we must keep only one push token for each remote client
    const recipientsByRemoteClientId = recipients.reduce((byRemoteClientId, recipient) => {
        if (!byRemoteClientId[recipient.remoteClientId]) byRemoteClientId[recipient.remoteClientId] = []
        byRemoteClientId[recipient.remoteClientId].push(recipient)
        return byRemoteClientId
    }, {})

    const result = []
    for (const remoteClientId of Object.keys(recipientsByRemoteClientId)) {
        const remoteClient = remoteClientById[remoteClientId]
        const appId = remoteClient.appId

        const priority = transportPriorityByAppId[appId]?.[isVoIP ? 'isVoIP' : 'isPush'] || DEFAULT_TRANSPORT_PRIORITY

        const byTransport = recipientsByRemoteClientId[remoteClientId].reduce((byTransport, recipient) => {
            byTransport[recipient.transport] = recipient
            return byTransport
        }, {})

        let recipientToPick = null
        for (const transport of priority) {
            if (byTransport[transport]) {
                recipientToPick = byTransport[transport]
                break
            }
        }

        if (recipientToPick) result.push(recipientToPick)
    }

    return result
}


/**
 * Splits remote clients by groups to ordered batches of clients using appId according to appGroups
 * @example
 * const tokens = [
 * { appId: 'appId1' }, { appId: 'appId1' },
 * { appId: 'appId2' }, { appId: 'appId2' },
 * { appId: 'appId3' }, { appId: 'appId3' },
 * { appId: 'appId4' }, { appId: 'appId4' },
 * { appId: 'appId5' }, { appId: 'appId5' },
 * { appId: 'appId6' }, { appId: 'appId6' },
 * ]
 * const appGroups = { group1: ['appId1', 'appId2'], group2: ['appId3', 'appId4'] }
 * const result = groupRemoteClientsByAppIdPriorityGroups(tokens, appGroups)
 * expect(result).toEqual({
 *     group1: [
 *         [{ appId: 'appId1' }, { appId: 'appId1' }],
 *         [{ appId: 'appId2' }, { appId: 'appId2' }],
 *     ],
 *     group2: [
 *         [{ appId: 'appId3' }, { appId: 'appId3' }],
 *         [{ appId: 'appId4' }, { appId: 'appId4' }],
 *     ],
 *     ungrouped: [
 *         [{ appId: 'appId5' }, { appId: 'appId5' }, { appId: 'appId6' }, { appId: 'appId6' }]
 *     ],
 * })
 * @param remoteClients {{appId: string}[]}
 * @param appIdPriorityGroups {{[s: string]: string[]}} key - group name, value - order of preferred appIds
 * @returns {{[s: string]: {appId: string}[][]}} key - group name, value - array of remote client batches, you should send pushes only to clients in one batch
 */
function groupIntoParallelGroupsWithSequentialBatches (remoteClients, appIdPriorityGroups = {}) {
    const appIdToGroupName = Object.fromEntries(
        Object.entries(appIdPriorityGroups)
            .flatMap(([groupName, appIds]) =>
                appIds.map(appId => [appId, groupName])
            )
    )
    const remoteClientsByGroupName = remoteClients.reduce((grouped, remoteClient) => {
        const groupName = appIdToGroupName[remoteClient.appId] || REMOTE_CLIENT_GROUP_UNGROUPED
        if (!grouped[groupName]) grouped[groupName] = []
        grouped[groupName].push(remoteClient)
        return grouped
    }, {})

    return Object.entries(remoteClientsByGroupName).reduce((entriesByGroup, [groupName, remoteClientsInGroup]) => {
        if (!appIdPriorityGroups[groupName]) {
            entriesByGroup[groupName] = [remoteClientsInGroup]
            return entriesByGroup
        }

        entriesByGroup[groupName] = appIdPriorityGroups[groupName]
            .map(appId => remoteClientsInGroup
                .filter(remoteClient => remoteClient.appId === appId)
            )
            .filter(batch => batch.length > 0)

        return entriesByGroup
    }, {})
}

module.exports = {
    getTokens,
    groupIntoParallelGroupsWithSequentialBatches,
}