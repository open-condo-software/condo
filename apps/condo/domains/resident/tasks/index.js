const {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
} = require('./sendBillingReceiptNotifications.task')

const {
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
} = require('./residentTicket.task')

module.exports = {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
}