const { createTask } = require('@open-condo/keystone/tasks')

const { generateReports } = require('./generateReports')
const { importBankTransactionsFrom1CClientBankExchange } = require('./importBankTransactionsFrom1CClientBankExchange')

module.exports = {
    generateReportsTask: createTask('generateReports', generateReports),
    importBankTransactionsFrom1CClientBankExchangeTask: createTask('importBankTransactionsFrom1CClientBankExchange', importBankTransactionsFrom1CClientBankExchange),
}