const get = require('lodash/get')

const {
    MESSAGE_DELIVERY_OPTIONS,
    DEFAULT_MESSAGE_DELIVERY_OPTIONS,
} = require('@condo/domains/notification/constants/constants')
const { NotificationUserSetting } = require('@condo/domains/notification/utils/serverSchema/index')

// Settings priorities
// The highest number is the most prioritized value
const ALL_MESSAGES_TYPES = 10
const ALL_TYPE_TRANSPORTS = 20
const PARTICULAR_TYPE_N_TRANSPORT = 30

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

    // Allow all messages for cases messages models without user (sms_verify, registration, ...)
    if (!get(message, ['user', 'id'])) {
        return userTransportSettings
    }

    /** @type {NotificationUserSetting[]} */
    const notificationUserSettings = await NotificationUserSetting.getAll(context, {
        user: { id: message.user.id },
        deletedAt: null,
        OR: [
            { messageType: null }, // possible settings for all messages
            { messageType: message.type }, // settings for specific message type
        ],
    })

    // The auxiliary object for settings prioritizing. Keeps the highest priority of applied setting
    const appliedPriorities = {}

    for (const setting of notificationUserSettings) {
        const messageType = get(setting, 'messageType')
        const messageTransport = get(setting, 'messageTransport')
        const isEnabled = get(setting, 'isEnabled')

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
        if (!!messageType && !!messageTransport && get(appliedPriorities, messageTransport, 0) < PARTICULAR_TYPE_N_TRANSPORT) {
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

module.exports = {
    getUserSettingsForMessage,
    getMessageOptions,
}
