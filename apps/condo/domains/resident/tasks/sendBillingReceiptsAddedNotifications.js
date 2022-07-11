const pino = require('pino')
const falsey = require('falsey')
const { get, isEmpty, isFunction, uniq, groupBy } = require('lodash')

const conf = require('@core/config')
const { getSchemaCtx } = require('@core/keystone/schema')

const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { CURRENCY_SYMBOLS, DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')
const { getStartDates } = require('@condo/domains/common/utils/date')
const { RedisVar } = require('@condo/domains/common/utils/redis-var')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')

const {
    BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')
const { getLocalized } = require('@condo/domains/common/utils/localesLoader')

const REDIS_LAST_DATE_KEY = 'LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT'

const logger = pino({
    name: 'send_billing_receipt_added_notifications',
    enabled: falsey(process.env.DISABLE_LOGGING),
})

const makeMessageKey = (period, accountId, categoryId, residentId) => `${period}:${accountId}:${categoryId}:${residentId}`

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param keystone
 * @param receipt
 * @param resident
 * @returns {Promise<void>}
 */
const prepareAndSendNotification = async (context, receipt, resident) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country')
    const locale = get(COUNTRIES, country || DEFAULT_LOCALE).locale
    const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
    const toPay = parseFloat(receipt.toPay)
    const category = getLocalized(locale, receipt.category.nameNonLocalized)
    const currencyCode = get(receipt, 'context.integration.currencyCode') || DEFAULT_CURRENCY_CODE

    const data = {
        residentId: resident.id,
        userId: resident.user.id,
        url: `${conf.SERVER_URL}/billing/receipts/${receipt.id}`,
        billingReceiptId: receipt.id,
        billingAccountId: receipt.account.id,
        billingPropertyId: receipt.property.id,
        period: receipt.period,
        category,
        toPay,
        currencySymbol: CURRENCY_SYMBOLS[currencyCode] || currencyCode,
    }

    const messageType = toPay > 0 ? BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE : BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE
    const messageData = {
        lang: locale,
        to: { user: { id: resident.user.id } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-billing-receipts-added-notifications' },
        uniqKey: notificationKey,
    }

    try {
        await sendMessage(context, messageData)
    } catch (e) {
        // TODO(DOMA-3343): handle error type
        logger.info({ message: 'sendMessage attempt:', error: safeFormatError(e), messageData })

        return 0
    }

    return 1
}

/**
 * Reads by portions all data required to send notifications to residents on available billing receipts and sends notifications
 * @param receiptsWhere
 * @param onLastDtChange
 * @returns {Promise<void>}
 */
const sendBillingReceiptsAddedNotificationsForPeriod = async (receiptsWhere, onLastDtChange ) => {
    const { keystone: context } = await getSchemaCtx('Resident')
    const receiptsCount = await BillingReceipt.count(context, receiptsWhere)
    let skip = 0, successCnt = 0

    logger.info({ message: 'Available Billing receipts:', receiptsCount, receiptsWhere })

    // Exit if no receipts found to proceed
    if (!receiptsCount) return

    let lastReceipt

    while (skip < receiptsCount) {
        const receipts = await BillingReceipt.getAll(context, receiptsWhere, { sortBy: ['createdAt_ASC'], first: 100, skip })

        if (isEmpty(receipts)) break

        skip += receipts.length

        const contextIds = uniq(receipts.map(receipt => get(receipt, 'context.id')))
        const accountIds = uniq(receipts.map(receipt => get(receipt, 'account.id')))
        const serviceConsumerWhere = {
            AND: [
                { billingAccount: { id_in: accountIds, deletedAt: null } },
                { billingIntegrationContext: { id_in: contextIds, deletedAt: null } },
                { deletedAt: null },
            ],
        }
        const serviceConsumers = await loadListByChunks({ context, list: ServiceConsumer, where: serviceConsumerWhere })
        const consumersByAccountId = groupBy(serviceConsumers, (item) => get(item, 'billingAccount.id'))

        for (const receipt of receipts) {
            const consumers = consumersByAccountId[receipt.account.id]

            // We have no ServiceConsumer records for this receipt
            if (isEmpty(consumers)) continue

            for (const consumer of consumers) {
                const resident = get(consumer, 'resident')

                // ServiceConsumer has no connection to Resident
                if (!resident) continue

                const success = await prepareAndSendNotification(context, receipt, resident)

                successCnt += success

                // Store receipt.createdAt as lastDt in order to continue from this point on next execution
            }
            lastReceipt = receipt
        }

        if (isFunction(onLastDtChange) && !isEmpty(lastReceipt)) await onLastDtChange(lastReceipt.createdAt)
    }
    logger.info({ message: 'Notifications sent:', successCnt, attempts: receiptsCount })
}


const sendBillingReceiptsAddedNotifications = async (resendFromDt = null) => {
    const { prevMonthStart, thisMonthStart } = getStartDates()
    const lastDtHandler = new RedisVar(REDIS_LAST_DATE_KEY)
    const handleLastDtChange = async (createdAt) => { await lastDtHandler.set(createdAt) }

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */
    const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : await lastDtHandler.get() || thisMonthStart
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
}
