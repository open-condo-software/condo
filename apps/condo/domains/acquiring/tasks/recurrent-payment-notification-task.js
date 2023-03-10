const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payment-notification/recurrent-payment-notification')

module.exports = createCronTask('recurrentPaymentNotification', '0 * * * *', async () => {
    await process()
})