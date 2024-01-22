const { discoverServiceConsumersTask } = require('./discoverServiceConsumers.task')
const { discoverServiceConsumersCronTask } = require('./discoverServiceConsumersCron.task')
const { notifyResidentsOnPaydayCronTask } = require('./notifyResidentsOnPaydayTask')
const {
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
} = require('./residentTicket.task')
const {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
} = require('./sendBillingReceiptNotifications.task')

module.exports = {
    notifyResidentsOnPaydayCronTask,
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
    manageResidentToPropertyAndOrganizationConnections,
    manageResidentToTicketClientConnections,
    discoverServiceConsumersCronTask,
    discoverServiceConsumersTask,
}
