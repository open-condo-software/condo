const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payments/recurrent-payment-processing')

// TODO set proper schedule
// TODO how its gonna work with horizontal app scaling?
module.exports = createCronTask('recurrentPaymentProcessing', '0 * * * *', async () => {
    await process()
})