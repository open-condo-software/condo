const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')
const { validate: uuidValidate } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BankAccount, BankTransaction } = require('@condo/domains/banking/utils/serverSchema')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const { dvSenderFields, INVALID_DATE_RECEIVED_MESSAGE } = require('@condo/domains/organization/integrations/sbbol/constants')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')

const { ERROR_PASSED_DATE_IN_THE_FUTURE } = require('../constants')


const logger = getLogger('sbbol/SbbolSyncTransactions')
const isTransactionsReceived = (response) => (get(response, 'error.cause', '') !== 'STATEMENT_RESPONSE_PROCESSING')

/**
 * Connects new BankTransaction records for BankAccount according to transaction data from SBBOL.
 *  @param {String} userId
 *  @param {BankAccount[]} bankAccounts
 *  @param {keystoneContext} context
 *  @param {String} statementDate
 *  @param {String} organizationId
 *  @param {String} bankIntegrationContextId
 */
async function _requestTransactions ({ userId, bankAccounts, context, statementDate, organizationId, bankIntegrationContextId }) {
    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    const transactions = []

    for (const bankAccount of bankAccounts) {
        let page = 1,
            doRequest = true,
            timeout = 1000,
            failedReq = 0

        do {
            let response = await fintechApi.getStatementTransactions(bankAccount.number, statementDate, page)

            while (!isTransactionsReceived(response)) {
                if (failedReq > 5) {
                    break
                }
                await new Promise( (resolve) => {
                    setTimeout(async () => {
                        response = await fintechApi.getStatementTransactions(
                            bankAccount.number,
                            statementDate,
                            page
                        )
                        resolve()
                    }, timeout)
                })
                failedReq++
                timeout *= 2
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
        } while ( doRequest )

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
                    integrationContext: { id: bankIntegrationContextId },
                    ...whereConditions,
                })

                if (!foundTransaction) {
                    const createdTransaction = await BankTransaction.create(context, {
                        organization: { connect: { id: organizationId } },
                        account: { connect: { id: bankAccount.id } },
                        integrationContext: { connect: { id: bankIntegrationContextId } },
                        meta: { sbbol: transaction },
                        ...whereConditions,
                        ...dvSenderFields,
                    })
                    logger.info(`BankTransaction instance created with id: ${createdTransaction.id}`)
                }
            }
        }
    }
    return transactions
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @param {String[] | String} date
 * @param {String} userId
 * @param {Organization} organization
 * @param {String} bankIntegrationContextId
 * @returns {Promise<Transaction[]>}
 */
async function requestTransactions ({ date, userId, organization, bankIntegrationContextId }) {
    if (!uuidValidate(userId)) return logger.error(`passed userId is not a valid uuid. userId: ${userId}`)
    if (!date) return logger.error('date is required')

    const { keystone: context } = await getSchemaCtx('Organization')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const bankAccounts = await BankAccount.getAll(context, { tin: organization.tin, deletedAt: null })
    const today = dayjs().format('YYYY-MM-DD')

    if (typeof date === 'string') {
        if (dayjs(date).format('YYYY-MM-DD') === 'Invalid Date') throw new Error(`${INVALID_DATE_RECEIVED_MESSAGE} ${date}`)

        // you can't request a report by a date in the future
        if (today < date) throw new Error(ERROR_PASSED_DATE_IN_THE_FUTURE)

        return await _requestTransactions({
            userId,
            bankAccounts,
            context,
            statementDate: date,
            organizationId: organization.id,
            bankIntegrationContextId,
        })
    } else {
        const transactions = []
        for (const statementDate of date) {
            if (dayjs(statementDate).format('YYYY-MM-DD') === 'Invalid Date') throw new Error(`${INVALID_DATE_RECEIVED_MESSAGE} ${date}`)

            if (today < statementDate) throw new Error(ERROR_PASSED_DATE_IN_THE_FUTURE)

            transactions.push(await _requestTransactions({
                userId,
                bankAccounts,
                context,
                statementDate,
                organizationId: organization.id,
                bankIntegrationContextId,
            }))
        }
        return transactions
    }
}

module.exports = {
    requestTransactions,
}