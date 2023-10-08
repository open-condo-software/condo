const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')
const { sendBillingReceiptsAddedNotifications, sendBillingReceiptsAddedNotificationsForPeriod } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications, sendResidentsNoAccountNotificationsForPeriod } = require('./sendResidentsNoAccountNotifications')


module.exports = {
    sendResidentsNoAccountNotifications,
    sendResidentsNoAccountNotificationsForPeriod,
    sendBillingReceiptsAddedNotifications,
    sendBillingReceiptsAddedNotificationsForPeriod,
    sendBillingReceiptNotifications,
}