const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payment-notification/recurrent-payment-notification')

// TODO set proper schedule
// TODO how its gonna work with horizontal app scaling?
module.exports = createCronTask('recurrentPaymentNotification', '0 * * * *', async () => {
    await process()
})