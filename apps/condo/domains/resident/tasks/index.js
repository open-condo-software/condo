const { discoverServiceConsumersTask } = require('./discoverServiceConsumers.task')
const {
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
} = require('./residentTicket.task')
const {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
} = require('./sendBillingReceiptNotifications.task')

module.exports = {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
    discoverServiceConsumersTask,
}
