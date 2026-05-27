const { createTask } = require('@open-condo/keystone/tasks')

const { sendBillingReceiptFilesByEmail } = require('./sendBillingReceiptFilesByEmail')
const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')

module.exports = {
    sendBillingReceiptFilesByEmail,
    sendNewBillingReceiptFilesNotifications: createTask('sendNewBillingReceiptFilesNotifications', sendNewBillingReceiptFilesNotifications),
}
