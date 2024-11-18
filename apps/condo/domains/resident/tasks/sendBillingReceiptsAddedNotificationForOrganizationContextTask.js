const get = require('lodash/get')
const groupBy = require('lodash/groupBy')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { getLocalized } = require('@open-condo/locales/loader')


const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { DEFAULT_CURRENCY_CODE, CURRENCY_SYMBOLS } = require('@condo/domains/common/constants/currencies')
const { getStartDates } = require('@condo/domains/common/utils/date')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { USER_BILLING_RECEIPT_NOTIFICATION_PERIOD_IN_SEC, BILLING_RECEIPTS_NOTIFIED_USERS_PREFIX } = require('@condo/domains/resident/constants')

const logger = getLogger('sendNewBillingReceiptNotification')

const makeMessageKey = (receiptId, period, accountNumber, categoryId, residentId) => `${receiptId}:${period}:${accountNumber}:${categoryId}:${residentId}}`
const makeAccountKey = (...args) => args.map(value => `${value}`.trim().toLowerCase()).join(':')
const getMessageTypeAndDebt = (toPay, toPayCharge) => {
    if (toPay <= 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, debt: 0 }
    // TODO (DOMA-3581) debt value population is disabled until user will be able to manage push notifications
    // if (toPayCharge && toPayCharge > 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, debt: toPayCharge }

    return { messageType: BILLING_RECEIPT_ADDED_TYPE, debt: null }
}

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param {keystone} context
 * @param receipt
 * @param resident
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, receipt, resident) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const locale = get(COUNTRIES, country).locale
    const notificationKey = makeMessageKey(receipt.id, receipt.period, receipt.account.number, receipt.category.id, resident.id)
    const toPayValue = parseFloat(receipt.toPay)
    const toPay = isNaN(toPayValue) ? null : toPayValue
    const toPayChargeValue = parseFloat(get(receipt, 'toPayDetails.charge'))
    const toPayCharge = isNaN(toPayChargeValue) ? null : toPayChargeValue
    const category = getLocalized(locale, receipt.category.nameNonLocalized)
    const currencyCode = get(receipt, 'context.integration.currencyCode') || DEFAULT_CURRENCY_CODE

    // Temporarily disabled checking toPayCharge value (it's temporarily not used by now)
    // if (isNull(toPay) || isNull(toPayCharge)) return 0
    // Disabled notifications of BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE type due to DOMA-6589
    if (isNull(toPay) || toPay <= 0) return 0

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
        organization: { id: resident.organization },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return isDuplicateMessage ? 0 : 1
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
    const redisClient = getRedisClient()
    const { thisMonthStart } = getStartDates()
    const receiptCreatedAfter = lastSyncDate || thisMonthStart

    const receipts = await fetchReceipts(contextId, receiptCreatedAfter)
    logger.info({ msg: 'Found receipts', data: { receiptsNumber: receipts.length, contextId }  })

    const receiptAccountData = await prepareReceiptsData(receipts, context)
    const serviceConsumers = await fetchServiceConsumers(context, receiptAccountData.accountNumbers)
    const consumersByAccountKey = groupConsumersByAccountKey(serviceConsumers)

    let successCount = 0
    logger.info({ msg: 'Left receipts', data: { receiptAccountData } })

    for (const [key, receipt] of Object.entries(receiptAccountData.receiptAccountKeys)) {
        const consumers = consumersByAccountKey[key]
        if (isEmpty(consumers)) continue

        successCount += await notifyConsumers(redisClient, keystone, receipt, consumers)
    }

    logger.info({ msg: 'Sent billing receipts', data: { successCount, contextId } })
}

async function fetchReceipts (contextId, receiptCreatedAfter) {
    const receiptsWhere = {
        createdAt_gt: receiptCreatedAfter,
        context: { id: contextId },
        deletedAt: null,
    }
    return find('BillingReceipt', receiptsWhere)
}

async function prepareReceiptsData (receipts, context) {
    const accountsNumbers = []
    const receiptAccountKeys = {}

    for (const receipt of receipts) {
        if (await hasNewerReceipts(receipt)) continue

        const processedReceipt = await processReceiptData(receipt, context)
        const accountNumber = get(processedReceipt, 'account.number')
        const addressKey = get(processedReceipt, 'account.property.addressKey')

        accountsNumbers.push(accountNumber)
        receiptAccountKeys[makeAccountKey(addressKey, accountNumber)] ||= processedReceipt
    }

    return { accountNumbers: accountsNumbers.filter(Boolean), receiptAccountKeys }
}

async function hasNewerReceipts (receipt) {
    const newerReceiptsWhere = {
        account: { id: get(receipt, 'account'), deletedAt: null },
        OR: [
            { receiver: { AND: [{ id: get(receipt, 'receiver') }, { deletedAt: null }] } },
            { category: { AND: [{ id: get(receipt, 'category') }, { deletedAt: null }] } },
        ],
        period_gt: get(receipt, 'period'),
        deletedAt: null,
    }
    const newerReceipts = await find('BillingReceipt', newerReceiptsWhere)
    return newerReceipts.length > 0
}

async function processReceiptData (receipt, context) {
    const account = await getById('BillingAccount', receipt.account)
    const billingProperty = await getById('BillingProperty', account.property)
    const category = await getById('BillingCategory', receipt.category)

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
        accountNumber_in: accountNumbers,
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
        id_in: residentIds,
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

async function notifyConsumers (redisClient, keystone, receipt, consumers) {
    let successConsumerCount = 0
    logger.info({ msg: 'Consumers for notifictaion', data: consumers})
    for (const consumer of consumers) {
        const resident = get(consumer, 'resident')
        if (!resident || resident.deletedAt) continue
        const isUserNotified = await redisClient.get(BILLING_RECEIPTS_NOTIFIED_USERS_PREFIX + resident.user)
        logger.info({ data: { user: resident.user, isUserNotified } })

        if (isUserNotified) continue

        const success = await prepareAndSendNotification(keystone, receipt, resident)
        if (success) {
            await redisClient.set(BILLING_RECEIPTS_NOTIFIED_USERS_PREFIX + resident.user, 'true', 'EX', USER_BILLING_RECEIPT_NOTIFICATION_PERIOD_IN_SEC, 'NX')
            successConsumerCount += 1
        }
    }
    return successConsumerCount
}

const taskName = 'sendBillingReceiptsAddedNotificationForOrganizationContextTask'

module.exports = {
    [taskName]: createTask(taskName, sendBillingReceiptsAddedNotificationForOrganizationContext),
    sendBillingReceiptsAddedNotificationForOrganizationContext,
    makeMessageKey,
    makeAccountKey,
    getMessageTypeAndDebt,
}
