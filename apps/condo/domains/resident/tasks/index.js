const { createTask, createCronTask, removeCronTask  } = require('@open-condo/keystone/tasks')

const { actualizeResidentToPropertyAndOrganizationConnections } = require('./actualizeResidentToPropertyAndOrganizationConnections')
const { actualizeTicketToResidentUserConnections } = require('./actualizeTicketToResidentUserConnections')
const { discoverServiceConsumers } = require('./discoverServiceConsumers')
const { discoverServiceConsumersLastDate } = require('./discoverServiceConsumersLastDate')
const { notifyResidentsOnPayday } = require('./notifyResidentsOnPayday')
const {
    sendBillingReceiptNotificationsWorkDays,
    sendBillingReceiptNotificationsWeekends,
} = require('./sendBillingReceiptNotifications')
const { sendMessageToResidentScopes } = require('./sendMessageToResidentScopes')

// Renamed to "discoverServiceConsumersLastDate"
removeCronTask('discoverServiceConsumersCronTask', '13 * * * *')
// Renamed to "sendBillingReceiptNotificationsWorkDays"
removeCronTask('sendBillingReceiptNotificationsWorkDaysTask', '17 7-12 * * 1-5')
// Renamed to "sendBillingReceiptNotificationsWeekends"
removeCronTask('sendBillingReceiptNotificationsWeekendsTask', '17 9-12 * * 0,6')

// PODS work according to UTC, so time in cron-tasks should also be according to UTC too.

module.exports = {
    sendBillingReceiptNotificationsWorkDaysCronTask: createCronTask('sendBillingReceiptNotificationsWorkDays', '17 7-12 * * 1-5', sendBillingReceiptNotificationsWorkDays),
    sendBillingReceiptNotificationsWeekendsCronTask: createCronTask('sendBillingReceiptNotificationsWeekends', '17 9-12 * * 0,6', sendBillingReceiptNotificationsWeekends),
    actualizeResidentToPropertyAndOrganizationConnectionsTask: createTask('actualizeResidentToPropertyAndOrganizationConnections', actualizeResidentToPropertyAndOrganizationConnections),
    actualizeTicketToResidentUserConnectionsTask: createTask('actualizeTicketToResidentUserConnections', actualizeTicketToResidentUserConnections),
    discoverServiceConsumersLastDateCronTask: createCronTask('discoverServiceConsumersLastDate', '13 * * * *', discoverServiceConsumersLastDate, { priority: 10 }),
    discoverServiceConsumersTask: createTask('discoverServiceConsumers', discoverServiceConsumers, { priority: 10 }),
    notifyResidentsOnPayDayCronTask: createCronTask('notifyResidentsOnPayday', '0 13 * * *', notifyResidentsOnPayday),
    sendMessageToResidentScopesTask: createTask('sendMessageToResidentScopes', sendMessageToResidentScopes),
}
