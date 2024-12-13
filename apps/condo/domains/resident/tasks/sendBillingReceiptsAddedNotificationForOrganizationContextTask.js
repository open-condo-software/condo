const dayjs = require('dayjs')
const { get, groupBy, isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find, getById, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { getLocalized } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { DEFAULT_CURRENCY_CODE, CURRENCY_SYMBOLS } = require('@condo/domains/common/constants/currencies')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { CAN_USER_GET_NEW_RECEIPT_NOTIFICATION, LAST_SEND_DATE_FOR_USER } = require('@condo/domains/resident/constants/constants')

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
 * @param {keystone} context
 * @param receipt
 * @param resident
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, receipt, resident) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const locale = get(COUNTRIES, country).locale
    const notificationKey = `NewReceiptPush:${resident.user}:${receipt.id}`
    const toPayValue = parseFloat(receipt.toPay)
    const toPay = isNaN(toPayValue) ? null : toPayValue
    const toPayChargeValue = parseFloat(get(receipt, 'toPayDetails.charge'))
    const toPayCharge = isNaN(toPayChargeValue) ? null : toPayChargeValue
    const category = getLocalized(locale, receipt.category.nameNonLocalized)
    const currencyCode = get(receipt, 'context.integration.currencyCode') || DEFAULT_CURRENCY_CODE
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
 * @param {string} lastSendDate
 * @returns {Promise<void>}
 */
async function sendBillingReceiptsAddedNotificationForOrganizationContext (context, lastSendDate) {
    logger.info({ msg: 'sendBillingReceiptsAddedNotificationForOrganizationContext starts' })
    const contextId = get(context, 'id')
    if (!contextId) throw new Error('Invalid BillingIntegrationOrganizationContext, cannot get context.id')

    const { keystone } = getSchemaCtx('Message')

    const receipts = await fetchReceipts(contextId, lastSendDate)

    const receiptAccountData = await prepareReceiptsData(receipts, context)
    const serviceConsumers = await fetchServiceConsumers(context, receiptAccountData.accountNumbers)
    const consumersByAccountKey = groupConsumersByAccountKey(serviceConsumers)

    let successSentMessages = 0
    let duplicatedSentMessages = 0
    let skippedUsers = 0
    for (const [key, receipts] of Object.entries(receiptAccountData.receiptAccountKeys)) {
        const consumers = consumersByAccountKey[key]
        if (isEmpty(consumers)) continue

        const [success, duplicate, skipped] = await notifyConsumers(keystone, receipts, consumers)
        successSentMessages += success
        duplicatedSentMessages += duplicate
        skippedUsers += skipped
    }

    const residents = serviceConsumers.map(sc => sc.resident)
    const residentsUnique = [...new Set(residents.filter(r => r.id))]
    const usersUnique = [...new Set(residentsUnique.map(ru => ru.user).filter(Boolean))]

    logger.info(
        { 
            msg: 'Sent billing receipts', data: {
                successSentMessages,
                duplicatedSentMessages,
                skippedUsers,
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
        toPay_gt: '0',
        deletedAt: null,
    }
    return find('BillingReceipt', receiptsWhere)
}

async function prepareReceiptsData (receipts, context) {
    const accountsNumbers = []
    const receiptAccountKeys = {}

    for (const receipt of receipts) {
        const processedReceipt = await processReceiptData(receipt, context)
        const accountNumber = get(processedReceipt, 'account.number')
        const addressKey = get(processedReceipt, 'account.property.addressKey')

        accountsNumbers.push(accountNumber)
        if (receiptAccountKeys[makeAccountKey(addressKey, accountNumber)]){
            receiptAccountKeys[makeAccountKey(addressKey, accountNumber)].push(processedReceipt)
        } else {
            receiptAccountKeys[makeAccountKey(addressKey, accountNumber)] = [processedReceipt]
        }
    }

    return { accountNumbers: accountsNumbers.filter(Boolean), receiptAccountKeys }
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

async function notifyConsumers (keystone, receipts, consumers) {
    const redisClient = await getRedisClient()
    const expirationInSeconds = 24 * 60 * 60 // 24 hours
    const expirationInSecondsForUserLastDate = 48 * 60 * 60 // 48 hours
    let successSentMessages = 0
    let duplicatedSentMessages = 0
    let usersAlreadyGotMessages = 0
    for (const consumer of consumers) {
        const resident = get(consumer, 'resident')
        if (!resident || resident.deletedAt) continue
        const redisKeyForBlock = `${CAN_USER_GET_NEW_RECEIPT_NOTIFICATION}:${resident.user}`
        const redisKeyForLastDate = `${LAST_SEND_DATE_FOR_USER}:${resident.user}`
        const canUserGetNotification = await redisClient.get(redisKeyForBlock)
        const userLastSendDate = await redisClient.get(redisKeyForLastDate)

        if (canUserGetNotification) {
            usersAlreadyGotMessages++
            continue
        }

        for (const receipt of receipts) {
            if (userLastSendDate && dayjs(receipt.createdAt).isBefore(dayjs(userLastSendDate))){
                continue
            }
            
            const success = await prepareAndSendNotification(keystone, receipt, resident)
            await redisClient.set(redisKeyForBlock, 'true', 'EX', expirationInSeconds)
            await redisClient.set(redisKeyForLastDate, dayjs().toISOString(), 'EX', expirationInSecondsForUserLastDate)
            if (success) {
                successSentMessages++
                break
            } else {
                duplicatedSentMessages++
            }
        }
    }
    return [successSentMessages, duplicatedSentMessages, usersAlreadyGotMessages]
}

const taskName = 'sendBillingReceiptsAddedNotificationForOrganizationContextTask'

module.exports = {
    [taskName]: createTask(taskName, sendBillingReceiptsAddedNotificationForOrganizationContext),
    sendBillingReceiptsAddedNotificationForOrganizationContext,
    makeAccountKey,
    getMessageTypeAndDebt,
}