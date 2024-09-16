const { createTask } = require('@open-condo/keystone/tasks')

const { connectPaymentsToBillingReceiptsForOrganizations } = require('./connectPaymentsToBillingReceiptsForOrganization')
const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')

module.exports = {
    connectPaymentsToBillingReceiptsForOrganizations: createTask('connectPaymentsToBillingReceiptsForOrganization', connectPaymentsToBillingReceiptsForOrganizations),
    sendNewBillingReceiptFilesNotifications: createTask('sendNewBillingReceiptFilesNotifications', sendNewBillingReceiptFilesNotifications),
}