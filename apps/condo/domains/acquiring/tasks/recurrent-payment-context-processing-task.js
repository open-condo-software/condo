const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payments-context/recurrent-payment-context-processing')

module.exports = createCronTask('recurrentPaymentContextProcessing', '0 * * * *', async () => {
    await process()
})