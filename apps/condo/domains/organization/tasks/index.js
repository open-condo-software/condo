const { removeCronTask } = require('@open-condo/keystone/tasks')

const refreshSbbolClientSecret = require('./refreshSbbolClientSecret')
const { syncSbbolBankAccountsCron: syncSbbolBankAccounts } = require('./syncSbbolBankAccounts')
const { syncSbbolTransactionsCron: syncSbbolTransactions } = require('./syncSbbolTransactions')

removeCronTask('syncSbbolSubscriptions', '20 9 * * *')
removeCronTask('syncSbbolSubscriptionPaymentRequestsState', '10 9 * * *')
removeCronTask('syncSbbolPaymentRequestsForSubscriptions', '0 9 * * *')

module.exports = {
    syncSbbolTransactions,
    refreshSbbolClientSecret,
    syncSbbolBankAccounts,
}