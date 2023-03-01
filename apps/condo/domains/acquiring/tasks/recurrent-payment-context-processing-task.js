const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payments-context/recurrent-payment-context-processing-entry')

// TODO set proper schedule
// TODO how its gonna work with horizontal app scaling?
module.exports = createCronTask('recurrentPaymentContextProcessing', '0 * * * *', async () => {
    await process()
})