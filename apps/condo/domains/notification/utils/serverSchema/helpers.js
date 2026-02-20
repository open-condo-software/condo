const { get, isEmpty } = require('lodash')

const {
    MESSAGE_DELIVERY_OPTIONS,
    DEFAULT_MESSAGE_DELIVERY_OPTIONS,
} = require('@condo/domains/notification/constants/constants')
const {
    NotificationUserSetting,
    NotificationAnonymousSetting,
} = require('@condo/domains/notification/utils/serverSchema/index')

// Settings priorities
// The highest number is the most prioritized value
const GLOBAL_SETTING = 5
const ALL_MESSAGES_TYPES = 10
const ALL_TYPE_TRANSPORTS = 20
const PARTICULAR_TYPE_N_TRANSPORT = 30

/**
 * @param context
 * @param userId
 * @param messageType
 * @returns {Promise<NotificationUserSetting[]>}
 */
async function getUserSettings (context, userId, messageType) {
    return await NotificationUserSetting.getAll(context, {
        deletedAt: null,
        OR: [
            {
                AND: [
                    { user_is_null: true }, // global settings
                    { messageType },
                ],
            },
            {
                AND: [
                    {
                        user: { id: userId },
                        OR: [
                            { messageType: null }, // possible settings for all messages
                            { messageType }, // settings for specific message type
                        ],
                    },
                ],
            },
        ],
    }, 'user { id } messageType messageTransport isEnabled')
}

/**
 * @param context
 * @param email
 * @param phone
 * @param messageType
 * @returns {Promise<NotificationAnonymousSetting[]>}
 */
async function getAnonymousSettings (context, email, phone, messageType) {
    if (isEmpty(email) && isEmpty(phone)) {
        return []
    }

    const subjectCondition = []
    if (!isEmpty(email)) {
        subjectCondition.push({ email })
    }
    if (!isEmpty(phone)) {
        subjectCondition.push({ phone })
    }

    const typeCondition = [{ messageType: null }] // possible settings for all messages
    if (!isEmpty(messageType)) {
        typeCondition.push({ messageType }) // settings for specific message type
    }

    return await NotificationAnonymousSetting.getAll(context, {
        AND: [
            { OR: subjectCondition },
            { OR: typeCondition },
            {
                deletedAt: null,
            },
        ],
    }, 'messageType messageTransport isEnabled email phone')
}


/**
 * @param context
 * @param {Message} message
 * @returns {Promise<Record<string, boolean>>}
 */
async function getUserSettingsForMessage (context, message) {
    const { transports } = getMessageOptions(message.type)

    /**
     * All messages/types/transports enabled by default
     * @type {Object<string, boolean>}}
     */
    const userTransportSettings = transports.reduce((result, transport) => ({ ...result, [transport]: true }), {})

    const isAnonymous = !get(message, ['user', 'id'])

    /** @type {NotificationUserSetting[] | NotificationAnonymousSetting[]} */
    const notificationUserSettings = isAnonymous
        ? await getAnonymousSettings(context, message.email, message.phone, message.type)
        : await getUserSettings(context, message.user.id, message.type)

    // The auxiliary object for settings prioritizing. Keeps the highest priority of applied setting
    const appliedPriorities = {}

    for (const setting of notificationUserSettings) {
        const messageType = get(setting, 'messageType')
        const messageTransport = get(setting, 'messageTransport')
        const isEnabled = get(setting, 'isEnabled')
        const hasUser = !!get(setting, ['user', 'id'])
        const useGlobalSetting = !isAnonymous && !hasUser
        
        // Priority: GLOBAL_SETTING (without user, specific transport)
        if (useGlobalSetting) {
            if (get(appliedPriorities, messageTransport, 0) < GLOBAL_SETTING) {
                userTransportSettings[messageTransport] = isEnabled
                appliedPriorities[messageTransport] = GLOBAL_SETTING
            }
        }
        
        // Priority: ALL_MESSAGES_TYPES
        if (!messageType && !messageTransport) {
            transports.forEach((transport) => {
                if (get(appliedPriorities, transport, 0) < ALL_MESSAGES_TYPES) {
                    userTransportSettings[transport] = isEnabled
                    appliedPriorities[transport] = ALL_MESSAGES_TYPES
                }
            })
        }

        // Priority: ALL_TYPE_TRANSPORTS
        if (!!messageType && !messageTransport) {
            transports.forEach((transport) => {
                if (get(appliedPriorities, transport, 0) < ALL_TYPE_TRANSPORTS) {
                    userTransportSettings[transport] = isEnabled
                    appliedPriorities[messageTransport] = ALL_TYPE_TRANSPORTS
                }
            })
        }

        // Priority: PARTICULAR_TYPE_N_TRANSPORT
        if (!useGlobalSetting && !!messageType && !!messageTransport && get(appliedPriorities, messageTransport, 0) < PARTICULAR_TYPE_N_TRANSPORT) {
            userTransportSettings[messageTransport] = isEnabled
            appliedPriorities[messageTransport] = PARTICULAR_TYPE_N_TRANSPORT
        }
    }

    return userTransportSettings
}

/**
 * Extends DEFAULT_MESSAGE_DELIVERY_OPTIONS with MESSAGE_DELIVERY_OPTIONS[type] if available
 * @param type
 * @returns {{isVoIP: boolean, transports: string[], strategy: string, throttlePeriodForUser: Number?}}
 */
function getMessageOptions (type) {
    const { strategy, defaultTransports, isVoIP, throttlePeriodForUser = null } = {
        ...DEFAULT_MESSAGE_DELIVERY_OPTIONS,
        ...get(MESSAGE_DELIVERY_OPTIONS, type, {}),
    }

    return { strategy, transports: defaultTransports, isVoIP, throttlePeriodForUser }
}

/**
 * Splits remote clients by groups to ordered chunks of clients using appId according to appGroups
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
 * const result = chunkRemoteClientsByAppGroups(tokens, appGroups)
 * expect(result).toEqual({
 *     group1: [
 *         [{ appId: 'appId1' }, { appId: 'appId1' }],
 *         [{ appId: 'appId2' }, { appId: 'appId2' }],
 *     ],
 *     group2: [
 *         [{ appId: 'appId3' }, { appId: 'appId3' }],
 *         [{ appId: 'appId4' }, { appId: 'appId4' }],
 *     ],
 *     ungrouped_appId5: [
 *         [{ appId: 'appId5' }, { appId: 'appId5' }]
 *     ],
 *     ungrouped_appId6: [
 *         [{ appId: 'appId6' }, { appId: 'appId6' }]
 *     ],
 * })
 * @param remoteClients {{appId: string}[]}
 * @param appsGroups {{[s: string]: string[]}} key - group name, value - order of preferred appIds
 * @returns {{[s: string]: {appId: string}[][]}} key - group name, value - array of remote client chunks, you should send pushes only to clients in one chunk
 */
function chunkRemoteClientsByAppGroups (remoteClients, appsGroups = {}) {
    const appIdToGroup = Object.fromEntries(
        Object.entries(appsGroups)
            .flatMap(([groupName, appIds]) =>
                appIds.map(appId => [appId, groupName])
            )
    )
    const tokensByGroup = remoteClients.reduce((grouped, remoteClient) => {
        const groupName = appIdToGroup[remoteClient.appId] || `ungrouped_${remoteClient.appId}`
        if (!grouped[groupName]) grouped[groupName] = []
        grouped[groupName].push(remoteClient)
        return grouped
    }, {})

    return Object.entries(tokensByGroup).reduce((entriesByGroup, [groupName, remoteClients]) => {
        if (!appsGroups[groupName]) {
            entriesByGroup[groupName] = [remoteClients]
            return entriesByGroup
        }

        let entries = []
        appsGroups[groupName].forEach((appId, i) => {
            entries[i] = remoteClients.filter(remoteClient => remoteClient.appId === appId)
        })
        entries = entries.filter(entry => entry?.length)
        entriesByGroup[groupName] = entries
        return entriesByGroup
    }, {})
}

/**
 * Gets value customPushType from MESSAGE_DELIVERY_OPTIONS[type] if it exists
 * @param messageType
 * @returns {customPushType: string | undefined}
 */
function getPreferredPushTypeByMessageType (messageType) {
    const { preferredPushType } = get(MESSAGE_DELIVERY_OPTIONS, messageType, {})
    return preferredPushType
}

module.exports = {
    getAnonymousSettings,
    getUserSettingsForMessage,
    getMessageOptions,
    getPreferredPushTypeByMessageType,
    chunkRemoteClientsByAppGroups,
}
