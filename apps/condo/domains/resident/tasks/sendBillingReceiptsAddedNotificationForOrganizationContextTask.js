const Big = require('big.js')
const dayjs = require('dayjs')
const get = require('lodash/get')
const groupBy = require('lodash/groupBy')
const isEmpty = require('lodash/isEmpty')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find, getSchemaCtx, getByCondition } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { getLocalized } = require('@open-condo/locales/loader')

const { getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { DEFAULT_CURRENCY_CODE, CURRENCY_SYMBOLS } = require('@condo/domains/common/constants/currencies')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { BILLING_CONTEXT_SYNCHRONIZATION_DATE } = require('@condo/domains/resident/constants/constants')

const logger = getLogger('sendNewBillingReceiptNotification')
const makeAccountKey = (...args) => args.map(value => `${value}`.trim().toLowerCase()).join(':')
const getMessageTypeAndDebt = (toPay, toPayCharge) => {
    if (toPay <= 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, debt: 0 }
    // TODO (DOMA-3581) debt value population is disabled until user will be able to manage push notifications
    // if (toPayCharge && toPayCharge > 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, debt: toPayCharge }

    return { messageType: BILLING_RECEIPT_ADDED_TYPE, debt: null }
}

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param {keystone} keystone
 * @param context
 * @param receipt
 * @param resident
 * @param lastSendDatePeriod
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (keystone, context, receipt, resident, lastSendDatePeriod) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const organizationId = get(resident, 'organization')
    const locale = get(COUNTRIES, country).locale
    const notificationKey = `${lastSendDatePeriod}:${resident.user}`
    const toPayValue = parseFloat(receipt.toPay)
    const toPay = isNaN(toPayValue) ? null : toPayValue
    const toPayChargeValue = parseFloat(get(receipt, 'toPayDetails.charge'))
    const toPayCharge = isNaN(toPayChargeValue) ? null : toPayChargeValue
    const category = getLocalized(locale, receipt.category.nameNonLocalized)
    const currencyCode = get(context, 'integration.currencyCode', DEFAULT_CURRENCY_CODE)
    const { messageType, debt } = getMessageTypeAndDebt(toPay, toPayCharge)

    const data = {
        residentId: resident.id,
        userId: resident.user,
        url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
        billingReceiptId: receipt.id,
        billingAccountNumber: receipt.account.number,
        billingPropertyId: receipt.property,
        period: receipt.period,
        category,
        toPay: debt,
        currencySymbol: CURRENCY_SYMBOLS[currencyCode] || currencyCode,
    }

    const messageData = {
        lang: locale,
        to: { user: { id: resident.user } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-billing-receipts-added-notifications' },
        uniqKey: notificationKey,
        organization: organizationId && { id: organizationId },
    }
    logger.info({ msg: 'New receipt push data', data: { messageData } })

    const { isDuplicateMessage } = await sendMessage(keystone, messageData)

    return isDuplicateMessage
}

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param {BillingIntegrationOrganizationContext} context
 * @param {string} lastSyncDate
 * @returns {Promise<void>}
 */
async function sendBillingReceiptsAddedNotificationForOrganizationContext (context, lastSyncDate) {
    logger.info({ msg: 'sendBillingReceiptsAddedNotificationForOrganizationContext starts' })

    const contextId = get(context, 'id')
    if (!contextId) throw new Error('Invalid BillingIntegrationOrganizationContext, cannot get context.id')

    const { keystone } = getSchemaCtx('Message')
    
    const redisClient = await getRedisClient()
    let lastSendDate = await redisClient.get(`${BILLING_CONTEXT_SYNCHRONIZATION_DATE}:${contextId}`)

    if (!lastSendDate) {
        lastSendDate = lastSyncDate
    }

    const receipts = await fetchReceipts(contextId, lastSendDate)

    if (!receipts.length){
        logger.info({ msg: 'No new receipts were found for context', data: { contextId } })
        
        return 
    }

    context.integration = await find('BillingIntegration', {
        id: context.integration,
        deletedAt: null,
    })

    const maxReceiptCreatedAt = dayjs(getMaxReceiptCreatedAt(receipts)).toISOString()
    logger.info({ msg: 'The latest receipt for the context', data: { maxReceiptCreatedAt } })
    const receiptAccountData = await prepareReceiptsData(receipts, context)
    const serviceConsumers = await fetchServiceConsumers(context, receiptAccountData.accountNumbers)
    const consumersByAccountKey = groupConsumersByAccountKey(serviceConsumers)

    let successSentMessages = 0
    let duplicatedSentMessages = 0
    for (const [key, receipt] of Object.entries(receiptAccountData.receiptAccountKeys)) {
        const consumers = consumersByAccountKey[key]
        if (isEmpty(consumers)) continue

        const [success, duplicate] = await notifyConsumers(keystone, context, receipt, consumers, lastSendDate)
        successSentMessages += success
        duplicatedSentMessages += duplicate
    }
    await redisClient.set(`${BILLING_CONTEXT_SYNCHRONIZATION_DATE}:${contextId}`, maxReceiptCreatedAt)

    const residents = serviceConsumers.map(sc => sc.resident)
    const residentsUnique = [...new Set(residents.filter(r => r.id))]
    const usersUnique = [...new Set(residentsUnique.map(ru => ru.user).filter(Boolean))]

    logger.info({ msg: 'sendBillingReceiptsAddedNotificationForOrganizationContext ends' })
    logger.info(
        { 
            msg: 'Sent billing receipts', data: {
                successSentMessages,
                duplicatedSentMessages,
                receiptsCount: receipts.length,
                contextId,
                serviceConsumersCount: serviceConsumers.length,
                residentsUniqueCount: residentsUnique.length,
                usersUniqueCount: usersUnique.length,
            }, 
        })
}

async function fetchReceipts (contextId, receiptCreatedAfter) {
    const receiptsWhere = {
        createdAt_gt: receiptCreatedAfter,
        context: { id: contextId },
        deletedAt: null,
    }

    const receipts = await find('BillingReceipt', receiptsWhere)

    const filteredReceipts = await Promise.all(
        receipts.map(async receipt => {
            const newerReceipts = await find('BillingReceipt', {
                account: { id: receipt.account, deletedAt: null },
                OR: [
                    { receiver: { AND: [{ id: receipt.receiver }, { deletedAt: null } ] } },
                    { category: { AND: [{ id: receipt.category }, { deletedAt: null } ] } },
                ],
                period_gt: receipt.period,
                deletedAt: null,
            })
            const paid = await getNewPaymentsSum(receipt.id)
            const isPayable = !(newerReceipts && newerReceipts.length)

            return {
                receipt,
                isEligibleForProcessing: isPayable && Big(receipt.toPay).minus(Big(paid)).gt(Big(0)),
            }
        })
    )

    return filteredReceipts
        .filter(({ isEligibleForProcessing }) => isEligibleForProcessing)
        .map(({ receipt }) => receipt)
}

async function prepareReceiptsData (receipts, context) {
    const accountsNumbers = []
    const receiptAccountKeys = {}

    for (const receipt of receipts) {
        const processedReceipt = await processReceiptData(receipt, context)
        const accountNumber = get(processedReceipt, 'account.number')
        const addressKey = get(processedReceipt, 'account.property.addressKey')

        accountsNumbers.push(accountNumber)
        receiptAccountKeys[makeAccountKey(addressKey, accountNumber)] ||= processedReceipt
    }

    return { accountNumbers: accountsNumbers.filter(Boolean), receiptAccountKeys }
}

async function processReceiptData (receipt, context) {
    const account = await getByCondition('BillingAccount', { id: receipt.account, deletedAt: null })
    const billingProperty = await getByCondition('BillingProperty', { id: account.property, deletedAt: null })
    const category = await getByCondition('BillingCategory', { id: receipt.category, deletedAt: null })

    return {
        ...receipt,
        context,
        account: {
            ...account,
            property: { ...billingProperty },
        },
        category,
    }
}

async function fetchServiceConsumers (context, accountNumbers) {
    const serviceConsumerWhere = {
        organization: { id: context.organization, deletedAt: null },
        accountNumber_in: accountNumbers.filter(Boolean),
        deletedAt: null,
    }
    const rawServiceConsumers = await find('ServiceConsumer', serviceConsumerWhere)

    const residents = await fetchResidents(rawServiceConsumers.map(sc => sc.resident))
    return rawServiceConsumers.map(serviceConsumer => ({
        ...serviceConsumer,
        resident: residents[serviceConsumer.resident] || {},
    }))
}

async function fetchResidents (residentIds) {
    const residents = await find('Resident', {
        id_in: residentIds.filter(Boolean),
        user: { deletedAt: null },
        deletedAt: null,
    })

    return residents.reduce((acc, resident) => {
        acc[resident.id] = resident
        return acc
    }, {})
}

function groupConsumersByAccountKey (serviceConsumers) {
    return groupBy(serviceConsumers, (item) => {
        const addressKey = get(item, 'resident.addressKey')
        const accountNumber = get(item, 'accountNumber')
        return makeAccountKey(addressKey, accountNumber)
    })
}

function getMaxReceiptCreatedAt (receipts) {
    let maxCreatedAt = null
    for (const receipt of receipts) {
        if (maxCreatedAt === null) maxCreatedAt = receipt.createdAt
        if (dayjs(receipt.createdAt).isAfter(maxCreatedAt)) maxCreatedAt = receipt.createdAt
    }
    
    return maxCreatedAt
}

async function notifyConsumers (keystone, context, receipt, consumers, lastSendDate) {
    let successSentMessages = 0
    let duplicatedSentMessages = 0
    for (const consumer of consumers) {
        const resident = get(consumer, 'resident')
        if (!resident || resident.deletedAt) continue

        logger.info({ msg: 'Notification data', data: { receipt, consumer, resident, lastSendDatePeriod: dayjs(lastSendDate).format('YYYY-MM-DD') } })
        const isDuplicated = await prepareAndSendNotification(keystone, context, receipt, resident, dayjs().format('YYYY-MM-DD'))

        if (isDuplicated) {
            duplicatedSentMessages++
            logger.info({ msg: 'User did not get notification', data: { user: resident.user } })
        } else {
            logger.info({ msg: 'User got notification', data: { user: resident.user } })
            successSentMessages++
        }

    }
    return [successSentMessages, duplicatedSentMessages]
}

const taskName = 'sendBillingReceiptsAddedNotificationForOrganizationContextTask'

module.exports = {
    [taskName]: createTask(taskName, sendBillingReceiptsAddedNotificationForOrganizationContext),
    sendBillingReceiptsAddedNotificationForOrganizationContext,
    makeAccountKey,
    getMessageTypeAndDebt,
}