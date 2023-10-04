const { createCronTask, removeCronTask, createTask } = require('@open-condo/keystone/tasks')

const { refreshSbbolClientSecret } = require('./refreshSbbolClientSecret')
const { syncSbbolBankAccounts } = require('./syncSbbolBankAccounts')
const { syncSbbolTransactions } = require('./syncSbbolTransactions')
const { syncSbbolTransactionsForToday } = require('./syncSbbolTransactionsForToday')

// Renamed to "syncSbbolTransactionsForToday"
removeCronTask('syncSbbolTransactionsCron', '0 0 * * *')
// Renamed to "syncSbbolBankAccounts"
removeCronTask('syncSbbolBankAccountsCron', '0 0 * * *')

module.exports = {
    refreshSbbolClientSecretCronTask: createCronTask('refreshSbbolClientSecret', '0 1 * * *', refreshSbbolClientSecret),
    syncSbbolBankAccountsCronTask: createCronTask('syncSbbolBankAccounts', '0 0 * * *', syncSbbolBankAccounts, { priority: 2 }),
    syncSbbolTransactionsForTodayCronTask: createCronTask('syncSbbolTransactionsForToday', '0 0 * * *', syncSbbolTransactionsForToday),
    syncSbbolTransactionsTask: createTask('syncSbbolTransactions', syncSbbolTransactions, { priority: 2 }),
}