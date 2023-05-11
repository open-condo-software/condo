const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')
const { validate: uuidValidate } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BANK_INTEGRATION_IDS, BANK_SYNC_TASK_STATUS } = require('@condo/domains/banking/constants')
const { BankAccount, BankTransaction, BankContractorAccount, predictTransactionClassification, BankSyncTask } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const { dvSenderFields, INVALID_DATE_RECEIVED_MESSAGE } = require('@condo/domains/organization/integrations/sbbol/constants')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')

const { ERROR_PASSED_DATE_IN_THE_FUTURE } = require('../constants')


const logger = getLogger('sbbol/SbbolSyncTransactions')
const isResponceProcessing = (response) => (get(response, 'error.cause', '') !== 'STATEMENT_RESPONSE_PROCESSING')
const dvSenderFieldsBankSyncTask = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'BankSyncTask' },
}
async function isTaskCancelled (context, taskId) {
    const task = await BankSyncTask.getOne(context, {
        id: taskId,
    })
    return task.status === BANK_SYNC_TASK_STATUS.CANCELLED
}
/**
 * Connects new BankTransaction records for BankAccount according to transaction data from SBBOL.
 *  @param {String} userId
 *  @param {BankAccount[]} bankAccounts
 *  @param {keystoneContext} context
 *  @param {String} statementDate
 *  @param {String} organizationId
 */
async function requestTransactionsForDate ({ userId, bankAccounts, context, statementDate, organizationId }) {
    const fintechApi = await initSbbolFintechApi(userId)

    if (!fintechApi) return

    const transactions = []

    for (const bankAccount of bankAccounts) {
        let page = 1,
            doNextRequest = true,
            timeout = 1000,
            failedReq = 0,
            summary

        do {
            let response = await fintechApi.getStatementTransactions(bankAccount.number, statementDate, page)
            summary = await fintechApi.getStatementSummary(
                bankAccount.number,
                statementDate,
            )

            //At the first request, the statement is just starting to form, so you need to repeat requests in a cycle until a successful response or throw an error
            while (!isResponceProcessing(response) || !isResponceProcessing(summary)) {
                if (failedReq > 5) {
                    break
                }
                await new Promise( (resolve) => {
                    setTimeout(async () => {
                        if (!isResponceProcessing(response)) {
                            response = await fintechApi.getStatementTransactions(
                                bankAccount.number,
                                statementDate,
                                page
                            )
                        }

                        if (!isResponceProcessing(summary)) {
                            summary = await fintechApi.getStatementSummary(
                                bankAccount.number,
                                statementDate,
                            )
                        }
                        resolve()
                    }, timeout)
                })
                failedReq++
                timeout *= 2
            }

            const receivedTransactions = get(response, 'data.transactions')
            const receivedSummary = get(summary, 'data.closingBalance')
            if (!receivedTransactions || !receivedSummary) {
                logger.error(`Unsuccessful response to transaction request by state: ${{
                    bankAccount: bankAccount.number,
                    statementDate,
                    page,
                }}`)
            } else {
                receivedTransactions.map( transaction => transactions.push(transaction))
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
            if (get(summary, 'error.cause') === 'WORKFLOW_FAULT') doNextRequest = false
        } while ( doNextRequest )

        if (summary) {
            await BankAccount.update(context, bankAccount.id, {
                meta: {
                    ...bankAccount.meta,
                    amount: get(summary, 'data.closingBalance.amount'),
                    amountAt: get(summary, 'data.composedDateTime'),
                },
                ...dvSenderFields,
            })
        }

        for (const transaction of transactions) {
            // If SBBOL returned a transaction with an unsupported currency, do not process
            if (ISO_CODES.includes(transaction.amount.currencyName)) {
                const formatedOperationDate = dayjs(transaction.operationDate).format('YYYY-MM-DD')
                const transactionAttrs = {
                    number: transaction.number,
                    date:  formatedOperationDate,
                    amount: transaction.amount.amount,
                    currencyCode: transaction.amount.currencyName,
                    purpose: transaction.paymentPurpose,
                    isOutcome: transaction.direction === 'CREDIT',
                    importId: transaction.uuid,
                    importRemoteSystem: SBBOL_IMPORT_NAME,
                }

                const [foundTransaction] = await BankTransaction.getAll(context, {
                    organization: { id: organizationId },
                    account: { id: bankAccount.id },
                    importId: transactionAttrs.importId,
                    importRemoteSystem: SBBOL_IMPORT_NAME,
                    deletedAt: null,
                }, { first: 1 })

                let bankContractorAccount
                // in mvp we will keep the contractor account for debit payments as well. Dividing them into individuals and legal entities
                if (transaction.direction === 'CREDIT') {
                    [bankContractorAccount] = await BankContractorAccount.getAll(context, {
                        organization: { id: organizationId },
                        tin: transaction.rurTransfer.payeeInn,
                        number: transaction.rurTransfer.payeeAccount,
                        deletedAt: null,
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
                    const bankIntegrationAccountContextId = get(bankAccount, 'integrationContext.id')
                    let costItem
                    try {
                        costItem = await predictTransactionClassification(context, {
                            purpose: transaction.paymentPurpose,
                            isOutcome: transactionAttrs.isOutcome,
                        })
                    } catch (err) {
                        logger.error({ msg: 'Can\'t get costItem from classification service', err })
                    }
                    const createdTransaction = await BankTransaction.create(context, {
                        organization: { connect: { id: organizationId } },
                        account: { connect: { id: bankAccount.id } },
                        integrationContext: { connect: { id: bankIntegrationAccountContextId } },
                        contractorAccount: bankContractorAccount ? { connect: { id: bankContractorAccount.id } } : undefined,
                        costItem: costItem ? { connect: { id: costItem.id } } : undefined,
                        meta: { sbbol: transaction },
                        ...transactionAttrs,
                        ...dvSenderFields,
                    })
                    logger.info({ msg: `BankTransaction instance created with id: ${createdTransaction.id}` })
                }

            } else {
                logger.warn({ msg: 'Not supported currency of BankTransaction from SBBOL. It will not be saved.', transaction })
            }
        }
    }
    return transactions
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @param {String[]} dateInterval
 * @param {uuid} userId
 * @param {Organization} organization
 * @param {uuid} bankSyncTaskId - optional
 * @returns {Promise<Transaction[]>}
 */
async function requestTransactions ({ dateInterval, userId, organization, bankSyncTaskId }) {
    if (!uuidValidate(userId)) return logger.error(`passed userId is not a valid uuid. userId: ${userId}`)
    if (!dateInterval) return logger.error('dateInterval is required')
    if (bankSyncTaskId && !uuidValidate(bankSyncTaskId)) return logger.error(`passed bankSyncTaskId is not a valid uuid. bankSyncTaskId: ${bankSyncTaskId}`)

    const { keystone: context } = await getSchemaCtx('Organization')
    const today = dayjs().format('YYYY-MM-DD')
    const transactions = []
    const totalCount = dateInterval.length
    let processedCount = 0
    let bankSyncTask
    let bankAccounts

    if (bankSyncTaskId) {
        bankSyncTask = await BankSyncTask.update(context, bankSyncTaskId, {
            totalCount,
            processedCount,
            ...dvSenderFieldsBankSyncTask,
        })
        bankAccounts = await BankAccount.getAll(context, {
            id: bankSyncTask.account.id,
        })
    } else {
        // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
        bankAccounts = await BankAccount.getAll(context, {
            tin: organization.tin,
            integrationContext: {
                enabled: true,
                integration: {
                    id: BANK_INTEGRATION_IDS.SBBOL,
                },
            },
            deletedAt: null,
        })
    }

    for (const statementDate of dateInterval) {
        if (bankSyncTask && await isTaskCancelled(context, bankSyncTaskId)) {
            return
        }
        if (dayjs(statementDate).format('YYYY-MM-DD') === 'Invalid Date') {
            if (bankSyncTaskId) {
                await BankSyncTask.update(context, bankSyncTaskId, {
                    status: BANK_SYNC_TASK_STATUS.ERROR,
                    ...dvSenderFieldsBankSyncTask,
                })
            }
            throw new Error(`${INVALID_DATE_RECEIVED_MESSAGE} ${statementDate}`)
        }

        if (today < statementDate) {
            if (bankSyncTaskId) {
                await BankSyncTask.update(context, bankSyncTaskId, {
                    status: BANK_SYNC_TASK_STATUS.ERROR,
                    ...dvSenderFieldsBankSyncTask,
                })
            }
            throw new Error(ERROR_PASSED_DATE_IN_THE_FUTURE)
        }

        transactions.push(await requestTransactionsForDate({
            userId,
            bankAccounts,
            context,
            statementDate,
            organizationId: organization.id,
        }))
        processedCount++
        if (bankSyncTaskId) {
            await BankSyncTask.update(context, bankSyncTaskId, {
                processedCount,
                ...dvSenderFieldsBankSyncTask,
            })
        }
    }
    return transactions
}

module.exports = {
    requestTransactions,
}