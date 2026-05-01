const { createTask } = require('@open-condo/keystone/tasks')

const { generateRentChargesCronTask } = require('./generateRentCharges')
const { sendNewBillingReceiptFilesNotifications } = require('./sendNewBillingReceiptFilesNotifications')

module.exports = {
    generateRentChargesCronTask,
    sendNewBillingReceiptFilesNotifications: createTask('sendNewBillingReceiptFilesNotifications', sendNewBillingReceiptFilesNotifications),
}
