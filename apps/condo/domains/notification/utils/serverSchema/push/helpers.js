const { find } = require('@open-condo/keystone/schema')

const {
    PUSH_TRANSPORT_TYPES,
} = require('@condo/domains/notification/constants/constants')

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
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {Promise<{appId, token, transport, pushType, remoteClientMeta}[]>}
 */
async function getTokens (ownerId, remoteClientId, isVoIP = false) {
    if (!ownerId && !remoteClientId) return []

    const conditions = getTokensConditions(ownerId, remoteClientId, isVoIP)
    const remoteClients =  await find('RemoteClient', conditions)
    return remoteClients.map(remoteClient => ({
        appId: remoteClient.appId,
        token: isVoIP ? remoteClient.pushTokenVoIP : remoteClient.pushToken,
        transport: isVoIP ? remoteClient.pushTransportVoIP : remoteClient.pushTransport,
        pushType: isVoIP ? remoteClient.pushTypeVoIP : remoteClient.pushType,
        remoteClientMeta: remoteClient.meta,
    }))
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
function groupByAppIdPriorityGroups (remoteClients, appIdPriorityGroups = {}) {
    const appIdToGroupName = Object.fromEntries(
        Object.entries(appIdPriorityGroups)
            .flatMap(([groupName, appIds]) =>
                appIds.map(appId => [appId, groupName])
            )
    )
    const remoteClientsByGroupName = remoteClients.reduce((grouped, remoteClient) => {
        const groupName = appIdToGroupName[remoteClient.appId] || 'ungrouped'
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
    groupByAppIdPriorityGroups,
}