const { createTask } = require('@open-condo/keystone/tasks')

const { closeCompletedTicketsCron: closeCompletedTickets } = require('./closeCompletedTickets')
const { exportIncidents } = require('./exportIncidents')
const { exportTickets } = require('./exportTickets')
const { manageTicketPropertyAddressChange } = require('./manageTicketPropertyAddressChange')
const { reopenDeferredTicketsCron: reopenDeferredTickets } = require('./reopenDeferredTickets')
const { sendTicketChangedNotifications } = require('./sendTicketChangedNotifications')
const { sendTicketCommentCreatedNotifications } = require('./sendTicketCommentCreatedNotifications')
const { sendTicketCreatedNotifications } = require('./sendTicketCreatedNotifications')

module.exports = {
    manageTicketPropertyAddressChange,
    closeCompletedTickets,
    reopenDeferredTickets,
    exportTickets,
    exportIncidents,
    sendTicketCommentCreatedNotifications: createTask('sendTicketCommentCreatedNotifications', sendTicketCommentCreatedNotifications),
    sendTicketCreatedNotifications,
    sendTicketChangedNotifications: createTask('sendTicketChangedNotifications', sendTicketChangedNotifications),
}
