const { createTask } = require('@open-condo/keystone/tasks')

const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')

module.exports = {
    sendNewBillingReceiptFilesNotifications: createTask('sendNewBillingReceiptFilesNotifications', sendNewBillingReceiptFilesNotifications),
}