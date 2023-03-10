const { createCronTask } = require('@open-condo/keystone/tasks')

const { process } = require('@condo/domains/acquiring/tasks/recurrent-payment-seeking-for-new-receipt/recurrent-payment-seeking-for-new-receipt')

module.exports = createCronTask('recurrentPaymentSeekingForNewReceipt', '0 * * * *', async () => {
    await process()
})