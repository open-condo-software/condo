const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')
const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications, sendResidentsNoAccountNotificationsForPeriod } = require('./sendResidentsNoAccountNotifications')


module.exports = {
    sendResidentsNoAccountNotifications,
    sendResidentsNoAccountNotificationsForPeriod,
    sendBillingReceiptsAddedNotifications,
    sendBillingReceiptNotifications,
}