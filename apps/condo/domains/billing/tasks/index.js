const { createTask } = require('@open-condo/keystone/tasks')

const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')
const { generateDebtClaims } = require('./generateDebtClaims')

module.exports = {
    sendNewBillingReceiptFilesNotifications: createTask('sendNewBillingReceiptFilesNotifications', sendNewBillingReceiptFilesNotifications),
    generateDebtClaims,
}