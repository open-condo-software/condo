const { get, isEmpty, isFunction, uniq, groupBy, isNull } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { getLocalized } = require('@open-condo/locales/loader')

const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { CURRENCY_SYMBOLS, DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')
const { getStartDates } = require('@condo/domains/common/utils/date')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const {
    BILLING_RECEIPT_ADDED_TYPE,
    // BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')


const REDIS_LAST_DATE_KEY = 'LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT'
const CHUNK_SIZE = 20

const logger = getLogger('sendBillingReceiptsAddedNotifications')

const makeMessageKey = (period, accountNumber, categoryId, residentId) => `${period}:${accountNumber}:${categoryId}:${residentId}`
const makeAccountKey = (...args) => args.map(value => `${value}`.trim().toLowerCase()).join(':')
const getMessageTypeAndDebt = (toPay, toPayCharge) => {
    if (toPay <= 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, debt: 0 }
    // TODO (DOMA-3581) debt value population is disabled until user will be able to manage push notifications
    // if (toPayCharge && toPayCharge > 0) return { messageType: BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, debt: toPayCharge }

    return { messageType: BILLING_RECEIPT_ADDED_TYPE, debt: null }
}

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param keystone
 * @param receipt
 * @param resident
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, receipt, resident) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const locale = get(COUNTRIES, country).locale
    const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
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
        userId: resident.user.id,
        url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
        billingReceiptId: receipt.id,
        billingAccountNumber: receipt.account.number,
        billingPropertyId: receipt.property.id,
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
        organization: resident.organization && { id: resident.organization.id },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return (isDuplicateMessage) ? 0 : 1
}

/**
 * Reads by portions all data required to send notifications to residents on available billing receipts and sends notifications
 * @param receiptsWhere
 * @param onLastDtChange
 * @returns {Promise<void>}
 */
const sendBillingReceiptsAddedNotificationsForPeriod = async (receiptsWhere, onLastDtChange) => {
    const { keystone: context } = await getSchemaCtx('Resident')
    const receiptsCount = await BillingReceipt.count(context, receiptsWhere)
    let skip = 0, successCount = 0
    const notifiedUsers = new Set()

    logger.info({ msg: 'sending billing receipts', receiptsCount, data: receiptsWhere })

    // Exit if no receipts found to proceed
    if (!receiptsCount) return

    let lastReceipt

    while (skip < receiptsCount) {
        const receipts = await BillingReceipt.getAll(context, receiptsWhere, { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip })

        if (isEmpty(receipts)) break

        skip += receipts.length

        let organisationIds = []
        const accountsNumbers = []
        for (const receipt of receipts) {
            organisationIds.push(get(receipt, 'context.organization.id'))
            accountsNumbers.push(get(receipt, 'account.number'))
        }
        organisationIds = uniq(organisationIds)

        const serviceConsumerWhere = {
            organization: { id_in: organisationIds },
            accountNumber_in: accountsNumbers,
            deletedAt: null,
        }
        const serviceConsumers = await loadListByChunks({ context, chunkSize: 50, list: ServiceConsumer, where: serviceConsumerWhere })

        const consumersByAccountKey = groupBy(serviceConsumers, (item) => {
            const params = [
                get(item, 'resident.address'),
                get(item, 'accountNumber'),
                get(item, 'resident.unitType'),
                get(item, 'resident.unitName'),
            ]

            return makeAccountKey(...params)
        })

        for (const receipt of receipts) {
            const params = [
                get(receipt, 'property.address'),
                get(receipt, 'account.number'),
                get(receipt, 'account.unitType'),
                get(receipt, 'account.unitName'),
            ]
            const receiptAccountKey = makeAccountKey(...params)
            const consumers = consumersByAccountKey[receiptAccountKey]

            // We have no ServiceConsumer records for this receipt
            if (isEmpty(consumers)) continue

            let successConsumerCount = 0

            for (const consumer of consumers) {
                const resident = get(consumer, 'resident')

                // ServiceConsumer has no connection to Resident
                if (!resident || resident.deletedAt) continue

                // NOTE: (DOMA-4351) skip already notified user to get rid of duplicate notifications
                if (notifiedUsers.has(resident.user.id)) continue

                const success = await prepareAndSendNotification(context, receipt, resident)

                if (success) notifiedUsers.add(resident.user.id)

                successConsumerCount += success
            }

            if (successConsumerCount > 0) successCount += 1

            lastReceipt = receipt
        }

        // Store receipt.createdAt as lastDt in order to continue from this point on next execution
        if (isFunction(onLastDtChange) && !isEmpty(lastReceipt)) await onLastDtChange(lastReceipt.createdAt)

        logger.info({ msg: `Processed ${skip} receipts of ${receiptsCount}.` })
    }
    logger.info({ msg: 'sent billing receipts', successCount, receiptsCount })
}


const sendBillingReceiptsAddedNotifications = async (resendFromDt = null) => {
    const { prevMonthStart, thisMonthStart } = getStartDates()
    const redisClient = getRedisClient()
    const handleLastDtChange = async (createdAt) => { await redisClient.set(REDIS_LAST_DATE_KEY, createdAt) }

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */
    const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : await redisClient.get(REDIS_LAST_DATE_KEY) || thisMonthStart

    logger.info({ msg: 'stored date', storedDt: await redisClient.get(REDIS_LAST_DATE_KEY) })

    const receiptsWhere = {
        period_in: [prevMonthStart, thisMonthStart],
        createdAt_gt: lastDt,
        deletedAt: null,
    }
    await sendBillingReceiptsAddedNotificationsForPeriod(receiptsWhere, handleLastDtChange)
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
    sendBillingReceiptsAddedNotificationsForPeriod,
    makeMessageKey,
    makeAccountKey,
    getMessageTypeAndDebt,
}
