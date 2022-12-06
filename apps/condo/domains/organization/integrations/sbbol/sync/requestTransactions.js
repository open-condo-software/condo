const { BankAccount, BankTransaction } = require('@condo/domains/banking/utils/serverSchema')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { get, isEmpty } = require('lodash')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const { v4: uuid } = require('uuid')
const dayjs = require('dayjs')

const logger = getLogger('sbbol/SbbolSyncTransactions')
const INVALID_DATE_RECEIVED_MESSAGE = 'An invalid date was received. It is possible to request transactions only for the past date'

/**
 * Connects new BankTransaction records for BankAccount according to transaction data from SBBOL.
 *  @param {String} userId
 *  @param {BankAccount[]} bankAccounts
 *  @param {keystoneContext} context
 *  @param {String} statementDate
 *  @param {String} organizationId
 */
async function _requestTransactions (userId, bankAccounts, context, statementDate, organizationId) {
    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    const transactions = []

    for (const bankAccount of bankAccounts) {
        let page = 1
        let doRequest = true

        do {
            let response = await fintechApi.getStatementTransactions(bankAccount.number, statementDate, page)

            if (get(response, 'error.cause', '') === 'STATEMENT_RESPONSE_PROCESSING') {
                do {
                    setTimeout(async () => {
                        response = get(await fintechApi.getStatementTransactions(
                            bankAccount.number,
                            statementDate,
                            page
                        ), 'data.transactions')
                    }, 2000)
                } while (get(response, 'error.cause', '') === 'STATEMENT_RESPONSE_PROCESSING')
            }

            get(response, 'data.transactions').map( transaction => transactions.push(transaction))
            page++

            // Checking that the response contains a link to the next page, if it is not there, then all transactions have been received
            if (isEmpty(get(response, 'data._links', []).filter(link => link.rel === 'next'))) {
                doRequest = false
            }

            // WORKFLOW_FAULT means that the request parameters are not valid. Occurs in two cases,
            // if the report is requested in the future tense and
            // if the report page does not exist. For example, the total report contains 3 pages, query 4 will return WORKFLOW_FAULT.
            if (get(transactions, 'error.cause') === 'WORKFLOW_FAULT') doRequest = false

            for (const transaction of transactions) {
                // If SBBOL returned a transaction with an unsupported currency, do not process
                if (!isEmpty(ISO_CODES.map( currencyName => get(transaction, 'amount.currencyName') === currencyName))) {
                    const formatedOperationDate = dayjs(transaction.operationDate).format('YYYY-MM-DD')
                    const whereConditions = {
                        number: transaction.number,
                        date:  formatedOperationDate,
                        amount: transaction.amount.amount,
                        currencyCode: transaction.amount.currencyName,
                        purpose: transaction.paymentPurpose,
                        dateWithdrawed: transaction.direction === 'CREDIT' ? formatedOperationDate : null,
                        dateReceived: transaction.direction === 'DEBIT' ? formatedOperationDate : null,
                        importId: transaction.uuid,
                        importRemoteSystem: SBBOL_IMPORT_NAME,
                    }

                    const foundTransaction = await BankTransaction.getOne(context, {
                        organization: { id: organizationId },
                        account: { id: bankAccount.id },
                        ...whereConditions,
                    })

                    if (!foundTransaction) {
                        const createdTransaction = await BankTransaction.create(context, {
                            organization: { connect: { id: organizationId } },
                            account: { connect: { id: bankAccount.id } },
                            meta: { sbbol: transaction },
                            ...whereConditions,
                            ...dvSenderFields,
                        })
                        logger.info(`BankTransaction instance created with id: ${createdTransaction.id}`)
                    }
                }
            }

        } while ( doRequest )
    }
    return transactions
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @param {String[] | String} date
 * @param {String} userId
 * @returns {Promise<Transaction[]>}
 */
async function requestTransactions (date, userId) {
    if (uuid.validate(userId)) return logger.error(`passed userId is not a valid uuid. userId: ${userId}`)
    if (!date) return logger.error('date is required')

    const { keystone: context } = await getSchemaCtx('Organization')
    const employee = await OrganizationEmployee.getOne(context, { user: { id: userId }, deletedAt: null })
    const bankAccounts = await BankAccount.getAll(context, { tin: employee.organization.tin })
    const organizationId = employee.organization.id
    const today = dayjs().format('YYYY-MM-DD')

    if (typeof date === 'string') {
        if (dayjs(date).format('YYYY-MM-DD') === 'Invalid Date') {
            return logger.error(`passed date is not a valid date. date: ${date}`)
        }
        // you can't request a report by a date in the future
        if (today < date) return logger.error({ msg: INVALID_DATE_RECEIVED_MESSAGE })

        return await _requestTransactions(userId, bankAccounts, context, date, organizationId)
    } else {
        const transactions = []
        for (const statementDate of date) {
            if (dayjs(date).format('YYYY-MM-DD') === 'Invalid Date') {
                return logger.error(`passed date is not a valid date. date: ${date}`)
            }
            // you can't request a report by a date in the future
            if (today < date) return logger.error({ msg: INVALID_DATE_RECEIVED_MESSAGE })

            transactions.push(await _requestTransactions(
                userId,
                bankAccounts,
                context,
                statementDate,
                organizationId,
            ))
        }
        return transactions
    }
}

module.exports = {
    requestTransactions,
}