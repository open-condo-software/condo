const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')
const { validate: uuidValidate } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankAccount, BankTransaction, BankContractorAccount } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const { dvSenderFields, INVALID_DATE_RECEIVED_MESSAGE } = require('@condo/domains/organization/integrations/sbbol/constants')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')

const { ERROR_PASSED_DATE_IN_THE_FUTURE } = require('../constants')


const logger = getLogger('sbbol/SbbolSyncTransactions')
const isTransactionsReceived = (response) => (get(response, 'error.cause', '') !== 'STATEMENT_RESPONSE_PROCESSING')
// ---------------------------------
const FAILED_STATUS = 'failed'
const IN_PROGRESS_STATUS = 'inProgress'
const COMPLETED_STATUS = 'completed'
// ^^ the code needed in the prototype. In MVP, synchronization status will be stored in BankSyncTask
/**
 * Connects new BankTransaction records for BankAccount according to transaction data from SBBOL.
 *  @param {String} userId
 *  @param {BankAccount[]} bankAccounts
 *  @param {keystoneContext} context
 *  @param {String} statementDate
 *  @param {String} organizationId
 */
async function _requestTransactions ({ userId, bankAccounts, context, statementDate, organizationId }) {
    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    const transactions = []

    for (const bankAccount of bankAccounts) {
        // ---------------------------------
        await BankAccount.update(context, bankAccount.id, {
            meta: {
                sbbol:{
                    syncTransactionsTaskStatus: IN_PROGRESS_STATUS,
                },
            },
            ...dvSenderFields,
        })
        // ^^ the code needed in the prototype. In MVP, synchronization status will be stored in BankSyncTask

        let page = 1,
            doNextRequest = true,
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

            const receivedTransactions = get(response, 'data.transactions')
            if (receivedTransactions) {
                receivedTransactions.map( transaction => transactions.push(transaction))
            } else {
                // ---------------------------------
                await BankAccount.update(context, bankAccount.id, {
                    meta: {
                        sbbol:{
                            syncTransactionsTaskStatus: FAILED_STATUS,
                        },
                    },
                    ...dvSenderFields,
                })
                // ^^ the code needed in the prototype. In MVP, synchronization status will be stored in BankSyncTask
                logger.error(`Unsuccessful response to transaction request by state: ${{ 
                    bankAccount: bankAccount.number, 
                    statementDate,
                    page,
                }}`)
            }

            page++

            // Checking that the response contains a link to the next page, if it is not there, then all transactions have been received
            if (isEmpty(get(response, 'data._links', []).filter(link => link.rel === 'next'))) {
                doNextRequest = false
            }

            // WORKFLOW_FAULT means invalid request parameters, that can occur in cases:
            // when report is requested for date in future
            // when report page does not exist, for example number is out of range of available pages
            if (get(transactions, 'error.cause') === 'WORKFLOW_FAULT') doNextRequest = false
        } while ( doNextRequest )

        for (const transaction of transactions) {
            // If SBBOL returned a transaction with an unsupported currency, do not process
            if (ISO_CODES.includes(transaction.amount.currencyName)) {
                const formatedOperationDate = dayjs(transaction.operationDate).format('YYYY-MM-DD')
                const whereTransactionConditions = {
                    number: transaction.number,
                    date:  formatedOperationDate,
                    amount: transaction.amount.amount,
                    currencyCode: transaction.amount.currencyName,
                    purpose: transaction.paymentPurpose,
                    isOutcome: transaction.direction === 'CREDIT',
                    importId: transaction.uuid,
                    importRemoteSystem: SBBOL_IMPORT_NAME,
                }

                const foundTransaction = await BankTransaction.getOne(context, {
                    organization: { id: organizationId },
                    account: { id: bankAccount.id },
                    ...whereTransactionConditions,
                })

                let bankContractorAccount
                // in mvp we will keep the contractor account for debit payments as well. Dividing them into individuals and legal entities
                if (transaction.direction === 'CREDIT') {
                    [bankContractorAccount] = await BankContractorAccount.getAll(context, {
                        organization: { id: organizationId },
                        tin: transaction.rurTransfer.payeeInn,
                        number: transaction.rurTransfer.payeeAccount,
                    }, { first: 1 })

                    if (!bankContractorAccount) {
                        bankContractorAccount = await BankContractorAccount.create(context, {
                            organization: { connect: { id: organizationId } },
                            name: transaction.rurTransfer.payeeName,
                            tin: transaction.rurTransfer.payeeInn,
                            country: RUSSIA_COUNTRY,
                            routingNumber: transaction.rurTransfer.payeeBankBic,
                            number: transaction.rurTransfer.payeeAccount,
                            currencyCode: transaction.amount.currencyName,
                            ...dvSenderFields,
                        })
                        logger.info({ msg: `BankContractorAccount instance created with id: ${bankContractorAccount.id}` })
                    }
                }

                if (!foundTransaction) {
                    const bankIntegrationContextId = get(bankAccount, 'integrationContext.id')
                    const createdTransaction = await BankTransaction.create(context, {
                        organization: { connect: { id: organizationId } },
                        account: { connect: { id: bankAccount.id } },
                        integrationContext: { connect: { id: bankIntegrationContextId } },
                        contractorAccount: bankContractorAccount ? { connect: { id: bankContractorAccount.id } } : undefined,
                        meta: { sbbol: transaction },
                        ...whereTransactionConditions,
                        ...dvSenderFields,
                    })
                    logger.info({ msg: `BankTransaction instance created with id: ${createdTransaction.id}` })
                }

            } else {
                // ---------------------------------
                await BankAccount.update(context, bankAccount.id, {
                    meta: {
                        sbbol:{
                            syncTransactionsTaskStatus: FAILED_STATUS,
                        },
                    },
                    ...dvSenderFields,
                })
                // ^^ the code needed in the prototype. In MVP, synchronization status will be stored in BankSyncTask
                logger.warn({ msg: 'Not supported currency of BankTransaction from SBBOL. It will not be saved.', transaction })
            }
        }
        // ---------------------------------
        await BankAccount.update(context, bankAccount.id, {
            meta: {
                sbbol:{
                    syncTransactionsTaskStatus: COMPLETED_STATUS,
                },
            },
            ...dvSenderFields,
        })
        // ^^ the code needed in the prototype. In MVP, synchronization status will be stored in BankSyncTask
    }
    return transactions
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @param {String} date
 * @param {String[]} dateInterval
 * @param {String} userId
 * @param {Organization} organization
 * @returns {Promise<Transaction[]>}
 */
async function requestTransactions ({ date, dateInterval, userId, organization }) {
    if (!uuidValidate(userId)) return logger.error(`passed userId is not a valid uuid. userId: ${userId}`)
    if (!date && !dateInterval) return logger.error('date or dateInterval is required')

    const { keystone: context } = await getSchemaCtx('Organization')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const bankAccounts = await BankAccount.getAll(context, {
        tin: organization.tin,
        integrationContext: {
            enabled: true,
            integration: {
                id: BANK_INTEGRATION_IDS.SBBOL,
            },
        },
        deletedAt: null,
    })
    const today = dayjs().format('YYYY-MM-DD')

    if (date) {
        if (dayjs(date).format('YYYY-MM-DD') === 'Invalid Date') throw new Error(`${INVALID_DATE_RECEIVED_MESSAGE} ${date}`)

        // you can't request a report by a date in the future
        if (today < date) throw new Error(ERROR_PASSED_DATE_IN_THE_FUTURE)

        return await _requestTransactions({
            userId,
            bankAccounts,
            context,
            statementDate: date,
            organizationId: organization.id,
        })
    }
    if (dateInterval){
        const transactions = []
        for (const statementDate of dateInterval) {
            if (dayjs(statementDate).format('YYYY-MM-DD') === 'Invalid Date') throw new Error(`${INVALID_DATE_RECEIVED_MESSAGE} ${date}`)

            if (today < statementDate) throw new Error(ERROR_PASSED_DATE_IN_THE_FUTURE)

            transactions.push(await _requestTransactions({
                userId,
                bankAccounts,
                context,
                statementDate,
                organizationId: organization.id,
            }))
        }
        return transactions
    }
}

module.exports = {
    requestTransactions,
}