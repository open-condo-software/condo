const { sendBillingReceiptNotifications } = require('./helpers')

async function sendBillingReceiptNotificationsWorkDays () {
    return await sendBillingReceiptNotifications()
}

async function sendBillingReceiptNotificationsWeekends () {
    return await sendBillingReceiptNotifications()
}

module.exports = {
    sendBillingReceiptNotificationsWorkDays,
    sendBillingReceiptNotificationsWeekends,
}