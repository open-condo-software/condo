const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')
const { validate: uuidValidate } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BANK_INTEGRATION_IDS, BANK_SYNC_TASK_STATUS } = require('@condo/domains/banking/constants')
const { BankAccount, BankTransaction, BankContractorAccount, predictTransactionClassification, BankSyncTask, BankIntegrationAccountContext } = require('@condo/domains/banking/utils/serverSchema')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const {
    ALTERNATIVE_CURRENCY_CODES_FROM_SBBOL,
    dvSenderFields,
    INVALID_DATE_RECEIVED_MESSAGE,
    SBBOL_IMPORT_NAME,
    ERROR_PASSED_DATE_IN_THE_FUTURE,
    SBBOL_ERRORS,
} = require('@condo/domains/organization/integrations/sbbol/constants')
const { initSbbolFintechApi, initSbbolClientWithToken } = require('@condo/domains/organization/integrations/sbbol/SbbolFintechApi')
const { getAllAccessTokensByOrganization } = require('@condo/domains/organization/integrations/sbbol/utils/getAccessTokenForUser')


const logger = getLogger('sbbol-sync-transactions')
const isResponseProcessing = (response) => (get(response, 'error.cause', '') === SBBOL_ERRORS.STATEMENT_RESPONSE_PROCESSING)
const dvSenderFieldsBankSyncTask = {
    dv: 1,
    sender: { dv: 1, fingerprint: 'BankSyncTask' },
}
async function isTaskCancelled (context, taskId) {
    const task = await BankSyncTask.getOne(context, {
        id: taskId,
    }, 'id status')
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
    let sbbolFintechClient, accessTokens, accessTokenIndex = 0, transactionException, summaryException

    sbbolFintechClient = await initSbbolFintechApi(userId, organizationId, true)

    accessTokens = await getAllAccessTokensByOrganization(context, organizationId)

    if (!sbbolFintechClient) {
        sbbolFintechClient = initSbbolClientWithToken(get(accessTokens, [accessTokenIndex, 'accessToken']), true)
    }

    const transactions = []

    for (const bankAccount of bankAccounts) {
        let page = 1,
            timeout = 1000,
            failedReq = 0,
            summary,
            response,
            allDataReceived = false,
            reqErrored = false

        // Request data until the response contains no errors,
        // has received the status "statement in progress",
        // there is no error when requesting using the client for the passed userId,
        // or there are unused access tokens
        while (!reqErrored && !allDataReceived && accessTokenIndex <= accessTokens.length) {
            if (isResponseProcessing(response) || !response) {
                response = await sbbolFintechClient.getStatementTransactions(bankAccount.number, statementDate, page)
            }

            if (isResponseProcessing(summary) || !summary) {
                summary = await sbbolFintechClient.getStatementSummary(
                    bankAccount.number,
                    statementDate,
                )
            }

            //At the first request, the statement is just starting to form, so you need to repeat requests in a cycle until a successful response or throw an error
            while (isResponseProcessing(response) || isResponseProcessing(summary)) {
                if (failedReq > 5) {
                    break
                }
                await new Promise( (resolve) => {
                    setTimeout(async () => {
                        if (isResponseProcessing(response)) {
                            response = await sbbolFintechClient.getStatementTransactions(
                                bankAccount.number,
                                statementDate,
                                page
                            )
                        }

                        if (isResponseProcessing(summary)) {
                            summary = await sbbolFintechClient.getStatementSummary(
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
            const receivedSummary = get(summary, 'data.closingBalance.amount')
            if (!receivedTransactions || !receivedSummary) {
                logger.error({
                    msg: 'Unsuccessful response to transaction request by state:',
                    entityId: organizationId,
                    entity: 'Organization',
                    data: {
                        state: {
                            bankAccount: bankAccount.number,
                            statementDate,
                            page,
                        },
                        responses: {
                            transactions: response,
                            summary,
                        },
                    },
                })
            } else {
                transactions.push(...receivedTransactions)
            }

            page++

            // Checking that the response contains a link to the next page, if it is not there, then all transactions have been received
            if (isEmpty(get(response, 'data._links', []).filter(link => link.rel === 'next'))) {
                allDataReceived = true
            }

            switch (get(response, 'error.cause')) {
                // WORKFLOW_FAULT means invalid request parameters, that can occur in cases:
                // when report is requested for date in future
                // when report page does not exist, for example, number is out of range of available pages
                case SBBOL_ERRORS.WORKFLOW_FAULT: {
                    reqErrored = true
                    transactionException = SBBOL_ERRORS.WORKFLOW_FAULT
                    break
                }
                // DATA_NOT_FOUND_EXCEPTION means that the statement not found and cannot be generated
                case SBBOL_ERRORS.DATA_NOT_FOUND_EXCEPTION: {
                    reqErrored = true
                    transactionException = SBBOL_ERRORS.DATA_NOT_FOUND_EXCEPTION
                    break
                }
                // ACTION_ACCESS_EXCEPTION means that the required access parameter for the requested data
                // is not included in the offer, accepted by SBBOL user
                case SBBOL_ERRORS.ACTION_ACCESS_EXCEPTION: {
                    reqErrored = true
                    transactionException = SBBOL_ERRORS.ACTION_ACCESS_EXCEPTION
                    break
                }
                case undefined: {
                    break
                }
                default: {
                    reqErrored = true
                    transactionException = get(response, 'error.cause')
                    break
                }
            }

            switch (get(summary, 'error.cause')) {
                case SBBOL_ERRORS.WORKFLOW_FAULT: {
                    reqErrored = true
                    summaryException = SBBOL_ERRORS.WORKFLOW_FAULT
                    break
                }
                case SBBOL_ERRORS.DATA_NOT_FOUND_EXCEPTION: {
                    reqErrored = true
                    summaryException = SBBOL_ERRORS.DATA_NOT_FOUND_EXCEPTION
                    break
                }
                case SBBOL_ERRORS.ACTION_ACCESS_EXCEPTION: {
                    reqErrored = true
                    summaryException = SBBOL_ERRORS.ACTION_ACCESS_EXCEPTION
                    break
                }
                case undefined: {
                    break
                }
                default: {
                    reqErrored = true
                    summaryException = get(summary, 'error.cause')
                }
            }

            if (get(response, 'error.cause') === SBBOL_ERRORS.UNAUTHORIZED || get(summary, 'error.cause') === SBBOL_ERRORS.UNAUTHORIZED) {
                allDataReceived = false
                reqErrored = false
                accessTokenIndex++
                if (accessTokenIndex < accessTokens.length) {
                    sbbolFintechClient = initSbbolClientWithToken(get(accessTokens, [accessTokenIndex, 'accessToken']), true)
                } else {
                    reqErrored = true
                    transactionException = SBBOL_ERRORS.UNAUTHORIZED
                    summaryException = SBBOL_ERRORS.UNAUTHORIZED
                }
            }
        }

        accessTokenIndex = 0

        if (summary) {
            const bankIntegrationAccountContextId = get(bankAccount, 'integrationContext.id')
            const bankIntegrationAccountContext = BankIntegrationAccountContext.getOne(context, {
                id: bankIntegrationAccountContextId,
            }, 'id meta')

            const meta = {}
            if (transactionException || summaryException) {
                meta.lastSyncStatus = BANK_SYNC_TASK_STATUS.ERROR
                meta.transactionException = transactionException ?? null
                meta.summaryException = summaryException ?? null
            } else {
                meta.amount = get(summary, 'data.closingBalance.amount')
                meta.amountAt = get(summary, 'data.composedDateTime')
                meta.lastSyncStatus = BANK_SYNC_TASK_STATUS.COMPLETED
            }
            meta.lastSyncAt = new Date().toISOString()

            await BankIntegrationAccountContext.update(context, bankIntegrationAccountContextId, {
                meta: {
                    ...bankIntegrationAccountContext.meta,
                    ...meta,
                },
                ...dvSenderFields,
            })
        }

        for (const transaction of transactions) {
            const currencyCode = transaction.amount.currencyName in ALTERNATIVE_CURRENCY_CODES_FROM_SBBOL
                ? ALTERNATIVE_CURRENCY_CODES_FROM_SBBOL[transaction.amount.currencyName]
                : transaction.amount.currencyName

            // If SBBOL returned a transaction with an unsupported currency, do not process
            if (ISO_CODES.includes(currencyCode)) {
                const formatedOperationDate = dayjs(transaction.operationDate).format('YYYY-MM-DD')
                const amount = get(transaction, 'amount.amount')
                const transactionAttrs = {
                    number: transaction.number,
                    date:  formatedOperationDate,
                    amount: typeof amount === 'number' ? String(amount) : amount,
                    currencyCode,
                    purpose: transaction.paymentPurpose,
                    // A debit transaction is an expense, since the direction of the transaction looks relative to the bank from which the data was received
                    isOutcome: transaction.direction === 'DEBIT',
                    importId: transaction.uuid,
                    importRemoteSystem: SBBOL_IMPORT_NAME,
                }

                const [foundTransaction] = await BankTransaction.getAll(context, {
                    organization: { id: organizationId },
                    account: { id: bankAccount.id },
                    importId: transactionAttrs.importId,
                    importRemoteSystem: SBBOL_IMPORT_NAME,
                    deletedAt: null,
                }, 'id', { first: 1 })

                let bankContractorAccount
                // in mvp we will keep the contractor account for debit payments as well. Dividing them into individuals and legal entities
                // A debit transaction is an expense, since the direction of the transaction looks relative to the bank from which the data was received
                if (transaction.direction === 'DEBIT') {
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
                            currencyCode,
                            ...dvSenderFields,
                        })
                        logger.info({
                            msg: `BankContractorAccount instance created ${bankContractorAccount.id}`,
                            entityId: organizationId,
                            entity: 'Organization',
                            data: {
                                bankContractorAccountId: bankContractorAccount.id,
                            },
                        })
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
                        logger.error({
                            msg: 'cannot get costItem from classification service',
                            entityId: organizationId,
                            entity: 'Organization',
                            err,
                        })
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
                    logger.info({
                        msg: 'BankTransaction instance created',
                        entityId: organizationId,
                        entity: 'Organization',
                        data: {
                            bankTransactionId: createdTransaction.id,
                        },
                    })
                }

            } else {
                logger.warn({
                    msg: 'not supported currency of BankTransaction from SBBOL. It will not be saved.',
                    entityId: organizationId,
                    entity: 'Organization',
                    data: {
                        transaction,
                    },
                })
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
    if (!uuidValidate(userId)) return logger.error({
        msg:'passed userId is not a valid uuid',
        entityId: organization.id,
        entity: 'Organization',
        data: {
            userId,
        },
    })
    if (!dateInterval) return logger.error('dateInterval is required')
    if (bankSyncTaskId && !uuidValidate(bankSyncTaskId)) return logger.error({
        msg: 'passed bankSyncTaskId is not a valid uuid',
        data: {
            bankSyncTaskId,
        },
    })

    const { keystone: context } = getSchemaCtx('Organization')
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
        }, 'id account { id }')
        bankAccounts = await BankAccount.getAll(context, {
            id: bankSyncTask.account.id,
        }, 'id number integrationContext { id }')
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
        }, 'id number integrationContext { id }')
    }

    for (const statementDate of dateInterval) {
        if (bankSyncTask && await isTaskCancelled(context, bankSyncTaskId)) {
            break
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