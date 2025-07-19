const { sendIncomingVoIPCallNotification } = require('./sendIncomingVoIPCallNotification')
const { sendRemoteClientsUpgradeAppNotifications } = require('./sendRemoteClientsUpgradeAppNotifications')

module.exports = {
    sendIncomingVoIPCallNotification,
    sendRemoteClientsUpgradeAppNotifications,
}
