const get = require('lodash/get')

const {
    MESSAGE_DELIVERY_OPTIONS,
    DEFAULT_MESSAGE_DELIVERY_OPTIONS,
} = require('@condo/domains/notification/constants/constants')

const { sendIncomingVoIPCallNotification } = require('./sendIncomingVoIPCallNotification')
const { sendRemoteClientsUpgradeAppNotifications } = require('./sendRemoteClientsUpgradeAppNotifications')

/**
 * Extends DEFAULT_MESSAGE_DELIVERY_OPTIONS with MESSAGE_DELIVERY_OPTIONS[type] if available
 * @param type
 * @returns {{isVoIP: boolean, transports: string[], strategy: string}}
 */
function getMessageOptions (type) {
    const { strategy, defaultTransports, isVoIP } =
        {
            ...DEFAULT_MESSAGE_DELIVERY_OPTIONS,
            ...get(MESSAGE_DELIVERY_OPTIONS, type, {}),
        }

    return { strategy, transports: defaultTransports, isVoIP }
}

module.exports = {
    sendIncomingVoIPCallNotification,
    sendRemoteClientsUpgradeAppNotifications,
    getMessageOptions,
}
