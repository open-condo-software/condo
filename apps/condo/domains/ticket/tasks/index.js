const { createCronTask, createTask } = require('@open-condo/keystone/tasks')

const { closeCompletedTicketsCron: closeCompletedTickets } = require('./closeCompletedTickets')
const { exportIncidents } = require('./exportIncidents')
const { exportTickets } = require('./exportTickets')
const { manageTicketPropertyAddressChange } = require('./manageTicketPropertyAddressChange')
const { reopenDeferredTickets } = require('./reopenDeferredTickets')
const { sendTicketCommentNotifications } = require('./sendTicketCommentNotifications')

module.exports = {
    closeCompletedTicketsCronTask: createCronTask('closeCompletedTickets', '0 1 * * *', closeCompletedTickets),
    exportIncidentsTask: createTask('exportIncidents', exportIncidents, { priority: 2 }),
    exportTicketsTask: createTask('exportTickets', exportTickets, { priority: 2 }),
    manageTicketPropertyAddressChangeTask: createTask('manageTicketPropertyAddressChange', manageTicketPropertyAddressChange),
    reopenDeferredTicketsCronTask: createCronTask('reopenDeferredTickets', '0 0/1 * * *', reopenDeferredTickets),
    sendTicketCommentNotificationsTask: createTask('sendTicketCommentNotifications', sendTicketCommentNotifications),
}
