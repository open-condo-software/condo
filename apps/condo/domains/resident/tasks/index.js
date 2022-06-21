const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications, sendResidentsNoAccountNotificationsForPeriod } = require('./sendResidentsNoAccountNotifications')

module.exports = {
    sendBillingReceiptsAddedNotifications,
    sendResidentsNoAccountNotifications,
    sendResidentsNoAccountNotificationsForPeriod,
}