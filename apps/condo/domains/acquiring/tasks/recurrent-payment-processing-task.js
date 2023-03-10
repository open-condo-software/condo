const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payments/recurrent-payment-processing')

module.exports = createCronTask('recurrentPaymentProcessing', '0 * * * *', async () => {
    await process()
})