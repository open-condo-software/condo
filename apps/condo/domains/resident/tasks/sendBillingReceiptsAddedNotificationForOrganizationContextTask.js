const Big = require('big.js')
const dayjs = require('dayjs')
const { get, groupBy, isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx, getByCondition, itemsQuery } = require('@open-condo/keystone/schema')
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
const { BILLING_CONTEXT_SYNCHRONIZATION_DATE, SEND_BILLING_RECEIPT_CHUNK_SIZE } = require('@condo/domains/resident/constants/constants')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const logger = getLogger()
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
    const organizationId = get(resident, 'residentOrganization.id', receipt.context.organization)
    const locale = get(COUNTRIES, country).locale
    const notificationKey = `${lastSendDatePeriod}:${resident.user.id}`
    const toPayValue = parseFloat(receipt.toPay)
    const toPay = isNaN(toPayValue) ? null : toPayValue
    const toPayChargeValue = parseFloat(get(receipt, 'toPayDetails.charge'))
    const toPayCharge = isNaN(toPayChargeValue) ? null : toPayChargeValue
    const category = getLocalized(locale, receipt.category.name)
    const currencyCode = get(context, 'integration.currencyCode', DEFAULT_CURRENCY_CODE)
    const { messageType, debt } = getMessageTypeAndDebt(toPay, toPayCharge)

    const data = {
        residentId: resident.id,
        userId: resident.user.id,
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
        to: { user: { id: resident.user.id } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-billing-receipts-added-notifications' },
        uniqKey: notificationKey,
        organization: organizationId && { id: organizationId },
    }
    logger.info({ msg: 'new receipt push data', data: { messageData } })

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

    const redisClient = await getKVClient()
    const lastSendDate = await redisClient.get(`${BILLING_CONTEXT_SYNCHRONIZATION_DATE}:${contextId}`) || lastSyncDate
    const { keystone } = getSchemaCtx('Message')
    const receiptsWhere = {
        createdAt_gt: lastSendDate,
        context: { id: contextId },
        deletedAt: null,
    }

    context.integration = await getByCondition('BillingIntegration', {
        id: context.integration,
        deletedAt: null,
    })

    const stats = initializeStats(contextId)
    let maxReceiptCreatedAt = lastSendDate
    let skip = 0
    let hasMoreData = true
    //There is a concern that new receipts may be loaded during execution and then we may lose some of them
    while (hasMoreData) {
        const rawReceipts = await itemsQuery('BillingReceipt', { where: receiptsWhere, first: SEND_BILLING_RECEIPT_CHUNK_SIZE, skip })
        stats.rawReceiptsCount += rawReceipts.length

        if (!rawReceipts.length && !skip) {
            logger.info({ msg: 'no new receipts were found for context', data: { contextId } })
            break
        }

        if (rawReceipts.length < SEND_BILLING_RECEIPT_CHUNK_SIZE) {
            hasMoreData = false
        }

        if (!rawReceipts.length){
            break
        }

        const receipts = await filterReceipts(rawReceipts)
        stats.isEligibleForProcessingReceipts += receipts.length

        if (!receipts.length) {
            skip += SEND_BILLING_RECEIPT_CHUNK_SIZE
            continue
        }

        maxReceiptCreatedAt = dayjs(getMaxReceiptCreatedAt(receipts, maxReceiptCreatedAt)).toISOString()
        const receiptAccountData = await prepareReceiptsData(receipts, context)
        const consumersByAccountKey = await fetchAndGroupConsumers(context, receiptAccountData.accountNumbers)

        await processReceipts(keystone, context, receiptAccountData, consumersByAccountKey, lastSendDate, stats)

        skip += SEND_BILLING_RECEIPT_CHUNK_SIZE
    }

    await redisClient.set(`${BILLING_CONTEXT_SYNCHRONIZATION_DATE}:${contextId}`, maxReceiptCreatedAt)

    logSummary(stats)
}

function initializeStats (contextId) {
    return {
        successSentMessages: 0,
        duplicatedSentMessages: 0,
        rawReceiptsCount: 0,
        isEligibleForProcessingReceipts: 0,
        contextId,
    }
}

async function filterReceipts (receipts) {
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

            const categories = await find('BillingCategory', { id: receipt.category, deletedAt: null })

            return {
                receipt,
                isEligibleForProcessing: isPayable && Big(receipt.toPay).minus(Big(paid)).gt(Big(0)),
                isSkipNotifications: get(categories, ['0', 'skipNotifications'], false),
            }
        })
    )

    return filteredReceipts
        .filter(({ isEligibleForProcessing, isSkipNotifications }) => isEligibleForProcessing && !isSkipNotifications)
        .map(({ receipt }) => receipt)
}

async function fetchAndGroupConsumers (context, accountNumbers) {
    const serviceConsumers = await fetchServiceConsumers(context, accountNumbers)
    return groupConsumersByAccountKey(serviceConsumers)
}

async function processReceipts (keystone, context, receiptAccountData, consumersByAccountKey, lastSendDate, stats) {
    for (const [key, receipt] of Object.entries(receiptAccountData.receiptAccountKeys)) {
        const consumers = consumersByAccountKey[key]
        if (isEmpty(consumers)) continue

        const [success, duplicate] = await notifyConsumers(keystone, context, receipt, consumers, lastSendDate)
        stats.successSentMessages += success
        stats.duplicatedSentMessages += duplicate
    }
}

function logSummary (stats) {
    logger.info({ msg: 'sendBillingReceiptsAddedNotificationForOrganizationContext ends' })
    logger.info({ msg: 'sent billing receipts', data: stats })
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
        resident: { deletedAt: null },
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
    const { keystone: context } = getSchemaCtx('Resident')
    const residents = await Resident.getAll(context, {
        id_in: residentIds.filter(Boolean),
        user: { deletedAt: null },
        deletedAt: null,
    }, 'id residentProperty { addressKey } residentOrganization { id country } user { id }')

    return residents.reduce((acc, resident) => {
        acc[resident.id] = resident
        return acc
    }, {})
}

function groupConsumersByAccountKey (serviceConsumers) {
    return groupBy(serviceConsumers, (item) => {
        const addressKey = get(item, 'resident.residentProperty.addressKey')
        const accountNumber = get(item, 'accountNumber')

        return makeAccountKey(addressKey, accountNumber)
    })
}

function getMaxReceiptCreatedAt (receipts, prevMaxCreatedAt) {
    let maxCreatedAt = prevMaxCreatedAt || null
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

        const isDuplicated = await prepareAndSendNotification(keystone, context, receipt, resident, dayjs().format('YYYY-MM-DD'))

        if (isDuplicated) {
            duplicatedSentMessages++
            logger.info({ msg: 'user did not get notification', data: { user: resident.user } })
        } else {
            logger.info({ msg: 'user got notification', data: { user: resident.user } })
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
