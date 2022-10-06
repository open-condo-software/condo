const {
    sendBillingReceiptNotificationsTaskWorkDays,
    sendBillingReceiptNotificationsTaskWeekends,
} = require('./sendBillingReceiptNotifications.task')

const {
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
} = require('./residentTicket.task')

module.exports = {
    sendBillingReceiptNotificationsTaskWorkDays,
    sendBillingReceiptNotificationsTaskWeekends,
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
}