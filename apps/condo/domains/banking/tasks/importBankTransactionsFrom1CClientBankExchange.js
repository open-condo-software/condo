const dayjs = require('dayjs')
const fetch = require('isomorphic-fetch')
const { get, isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const {
    BANK_INTEGRATION_IDS,
    _1C_CLIENT_BANK_EXCHANGE,
    BANK_SYNC_TASK_STATUS,
    TRANSACTIONS_NOT_ADDED,
} = require('@condo/domains/banking/constants')
const {
    BankIntegration,
    BankAccount,
    BankIntegrationOrganizationContext,
    BankIntegrationAccountContext,
    BankTransaction,
    BankContractorAccount,
    BankSyncTask,
    predictTransactionClassification,
} = require('@condo/domains/banking/utils/serverSchema')
const { convertFrom1CExchangeToSchema } = require('@condo/domains/banking/utils/serverSchema/converters/convertFrom1CExchangeToSchema')
const { ConvertToUTF8 } = require('@condo/domains/banking/utils/serverSchema/converters/convertToUTF8')
const { TASK_PROCESSING_STATUS, TASK_COMPLETED_STATUS, TASK_ERROR_STATUS } = require('@condo/domains/common/constants/tasks')
const { sleep } = require('@condo/domains/common/utils/sleep')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

// Avoids producing "BankSyncTaskHistoryRecord" record for each iteration in the processing loop, when we update progress
// Practically, we need to
const TASK_PROGRESS_UPDATE_INTERVAL = 10 * 1000 // 10sec

// Rough solution to offload server in case of processing many thousands of records
const SLEEP_TIMEOUT = conf.WORKER_BATCH_OPERATIONS_SLEEP_TIMEOUT || 200

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'importBankTransactions' } }

const logger = getLogger('importBankTransactions')

async function throwErrorAndSetErrorStatusToTask (context, task, errorMessage) {
    const { meta } = task
    await BankSyncTask.update(context, task.id, {
        ...DV_SENDER,
        status: TASK_ERROR_STATUS,
        meta: {
            ...meta,
            errorMessage,
        },
    })
    throw new Error(errorMessage)
}

/**
 * Imports bank transactions according to specified BankSyncTask
 * @param taskId
 * @returns {Promise<{integrationContext, transactions: *[], account: *}>}
 */
const importBankTransactionsFrom1CClientBankExchange = async (taskId) => {
    if (!taskId) throw new Error('taskId is undefined')
    const { keystone: context } = await getSchemaCtx('BankSyncTask')
    let task = await BankSyncTask.getOne(context, { id: taskId })
    if (!task) {
        throw new Error(`Cannot find BankSyncTask by id="${taskId}"`)
    }
    const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS['1CClientBankExchange'] })
    if (!integration) {
        throw new Error('Cannot find BankIntegration with id "61e3d767-bd62-40e3-a503-f885b242d262" corresponding to import from file in "1CClientBankExchange" format. This is a system error, not an wrong input. Record of this integration should be presented in database.')
    }

    const { file, organization, property } = task

    const taskOrganization = await Organization.getOne(context, {
        id: organization.id,
    })

    const existingIntegrationOrganizationContext = await BankIntegrationOrganizationContext.getOne(context, {
        integration: { id: integration.id },
        organization: { id: organization.id },
    })
    // Check for manually disabled integration context
    // At this stage there is no matter, when it does not exist
    if (existingIntegrationOrganizationContext && !existingIntegrationOrganizationContext.enabled) {
        await throwErrorAndSetErrorStatusToTask(context, task, `Manually disabled BankIntegrationOrganizationContext(id="${existingIntegrationOrganizationContext.id}") was found for Organization(id="${organization.id}"). Operation cannot be executed.`)
    }

    let conversionResult
    let response
    try {
        response = await fetch(file.publicUrl)
    } catch (e) {
        throw new Error(`Could not fetch file by url "${file.publicUrl}". Error: ${e.message}`)
    }
    if (!response.ok) {
        throw new Error(`Could not fetch file by url "${file.publicUrl}". Response code: ${response.status} ${response.statusText}`)
    }
    const fileBuffer = await response.buffer()

    const { result } = new ConvertToUTF8(fileBuffer).convert()
    try {
        conversionResult = convertFrom1CExchangeToSchema(result)
    } catch (error) {
        await throwErrorAndSetErrorStatusToTask(context, task, `Cannot parse uploaded file in 1CClientBankExchange format. Error: ${error.message}`)
    }
    const { bankAccountData, bankTransactionsData } = conversionResult
    let bankAccount = await BankAccount.getOne(context, {
        number: bankAccountData.number,
        organization: { id: organization.id },
        deletedAt: null,
    })
    if (property) {
        const adminContext = await context.createContext({ skipAccessControl: true })
        const accountByProperty = await BankAccount.getAll(adminContext, {
            organization: { id: organization.id },
            number_not: bankAccountData.number,
            property: { id: property.id },
            deletedAt: null,
        })
        if (!isEmpty(accountByProperty)) {
            const errorMsg = `Already have an account with the same Property { id: ${property.id} }.`
            await BankSyncTask.update(context, task.id, {
                status: BANK_SYNC_TASK_STATUS.ERROR,
                meta: {
                    errorMessage: errorMsg,
                },
                ...DV_SENDER,
            })
            logger.error({ msg: errorMsg })
            throw new Error(errorMsg)
        }
    }
    let integrationContext
    if (!bankAccount) {
        integrationContext = await BankIntegrationAccountContext.create(context, {
            ...DV_SENDER,
            integration: { connect: { id: integration.id } },
            organization: { connect: { id: organization.id } },
            meta: bankAccountData.meta,
        })
        const data = {
            ...DV_SENDER,
            number: bankAccountData.number,
            routingNumber: bankAccountData.routingNumber,
            tin: taskOrganization.tin,
            country: taskOrganization.country,
            currencyCode: 'RUB',
            meta: bankAccountData.meta,
            organization: { connect: { id: organization.id } },
            integrationContext: { connect: { id: integrationContext.id } },
        }

        if (property) data.property = { connect: { id: property.id } }
        bankAccount = await BankAccount.create(context, data)
    } else {
        const bankAccountUpdatePayload = {
            meta: bankAccountData.meta,
        }

        // In case if Property was deleted and BankAccount did not -> update link to a new property to connect with existing transactions
        if (bankAccount.property !== property.id) {
            bankAccountUpdatePayload.property = { connect: { id: property.id } }
        }

        if (bankAccount.integrationContext) {
            if (get(bankAccount, ['integrationContext', 'integration', 'id']) !== BANK_INTEGRATION_IDS['1CClientBankExchange']) {
                await throwErrorAndSetErrorStatusToTask(context, task, 'Another integration is used for this bank account, that fetches transactions in a different way. You cannot import transactions from file in this case')
            }
            if (get(bankAccount, ['integrationContext', 'enabled']) === false) {
                await throwErrorAndSetErrorStatusToTask(context, task, `Manually disabled BankIntegrationAccountContext(id="${bankAccount.integrationContext.id}") for BankAccount(id="${bankAccount.id}"). Operation cannot be executed`)
            }
            integrationContext = bankAccount.integrationContext
        } else {
            integrationContext = await BankIntegrationAccountContext.create(context, {
                ...DV_SENDER,
                integration: { connect: { id: integration.id } },
                organization: { connect: { id: organization.id } },
                meta: bankAccountData.meta,
            })
            bankAccountUpdatePayload.integrationContext = {
                connect: { id: integrationContext.id },
            }
        }

        bankAccount = await BankAccount.update(context, bankAccount.id, {
            ...DV_SENDER,
            ...bankAccountUpdatePayload,
        })
        await BankIntegrationAccountContext.update(context, bankAccount.integrationContext.id, {
            ...DV_SENDER,
            meta: bankAccountData.meta,
        })
    }

    if (!existingIntegrationOrganizationContext) {
        await BankIntegrationOrganizationContext.create(context, {
            ...DV_SENDER,
            integration: { connect: { id: integration.id } },
            organization: { connect: { id: organization.id } },

        })
    }

    const taskUpdatePayload = {
        ...DV_SENDER,
        totalCount: bankTransactionsData.length,
        processedCount: 0,
    }
    if (!task.account) {
        taskUpdatePayload.account = { connect: { id: bankAccount.id } }
    }
    if (!task.integrationContext) {
        taskUpdatePayload.integrationContext = { connect: { id: integrationContext.id } }
    }
    await BankSyncTask.update(context, taskId, taskUpdatePayload)


    let lastProgress = Date.now()
    const transactions = []
    let duplicatedTransactions = []

    for (let i = 0; i < bankTransactionsData.length; i++) {

        // User can cancel the task at any time, in this all operations should be stopped
        task = await BankSyncTask.getOne(context, { id: taskId })
        const taskStatus = get(task, 'status')
        if (!task || taskStatus !== TASK_PROCESSING_STATUS) {
            logger.info({ msg: 'status != processing. Aborting processing bank transactions loop', taskStatus, taskSchemaName: BankSyncTask.gql.SINGULAR_FORM, taskId })
            return
        }

        const transactionData = bankTransactionsData[i]
        const importId = [dayjs(transactionData.date).format('YYYY-MM-DD'), transactionData.number].join('_')
        const existingTransaction = await BankTransaction.getOne(context, {
            importId,
            organization: {
                id: organization.id,
            },
            deletedAt: null,
        })
        if (existingTransaction) {
            duplicatedTransactions.push(importId)
            continue
        }

        let costItem
        try {
            costItem = await predictTransactionClassification(context, { purpose: transactionData.purpose, isOutcome: transactionData.isOutcome })
        } catch (err) {
            logger.error({ msg: 'Can\'t get costItem from classification service', err })
        }

        const payload = {
            ...DV_SENDER,
            number: transactionData.number,
            date: transactionData.date.format('YYYY-MM-DD'),
            isOutcome: transactionData.isOutcome,
            purpose: transactionData.purpose,
            currencyCode: 'RUB',
            amount: transactionData.amount.toString(),
            // NOTE(antonal): 1CClientBankExchange does not have required field with some unique identifier, rely on value from "number" field
            importId,
            importRemoteSystem: _1C_CLIENT_BANK_EXCHANGE,
            organization: { connect: { id: organization.id } },
            account: { connect: { id: bankAccount.id } },
            integrationContext: { connect: { id: integrationContext.id } },
            meta: transactionData.meta,
            costItem: costItem ? { connect: { id: costItem.id } } : undefined,
        }
        if (transactionData.contractorAccount) {
            let existingContractorAccount = await BankContractorAccount.getOne(context, {
                organization: { id: organization.id },
                number: transactionData.contractorAccount.number,
                tin: transactionData.contractorAccount.tin,
            })
            let contractorAccountId
            if (existingContractorAccount) {
                contractorAccountId = existingContractorAccount.id
            } else {
                const newContractorAccount = await BankContractorAccount.create(context, {
                    ...DV_SENDER,
                    ...transactionData.contractorAccount,
                    country: taskOrganization.country,
                    currencyCode: 'RUB',
                    organization: { connect: { id: organization.id } },
                })
                contractorAccountId = newContractorAccount.id
            }
            payload.contractorAccount = { connect: { id: contractorAccountId } }
        }

        const createdBankTransaction = await BankTransaction.create(context, payload)
        transactions.push(createdBankTransaction)

        if (Date.now() - lastProgress > TASK_PROGRESS_UPDATE_INTERVAL) {
            lastProgress = Date.now()
            task = await BankSyncTask.update(context, taskId, {
                ...DV_SENDER,
                processedCount: i,
            })
        }

        await sleep(SLEEP_TIMEOUT)
    }

    if (isEmpty(transactions) && !isEmpty(duplicatedTransactions)) {
        logger.error({ msg: TRANSACTIONS_NOT_ADDED.message })
        await BankSyncTask.update(context, taskId, {
            ...DV_SENDER,
            status: TASK_ERROR_STATUS,
            meta: {
                errorMessage: i18n(TRANSACTIONS_NOT_ADDED.messageForUser),
                duplicatedTransactions,
            },
        })

        throw new Error(TRANSACTIONS_NOT_ADDED.message)
    }

    await BankSyncTask.update(context, taskId, {
        ...DV_SENDER,
        processedCount: transactions.length,
        status: TASK_COMPLETED_STATUS,
        ...(duplicatedTransactions.length > 0 && { meta: { duplicatedTransactions } }),
    })

    return {
        account: bankAccount,
        integrationContext,
        transactions,
    }
}

module.exports = {
    importBankTransactionsFrom1CClientBankExchange: createTask('importBankTransactionsFrom1CClientBankExchange', importBankTransactionsFrom1CClientBankExchange),
}
