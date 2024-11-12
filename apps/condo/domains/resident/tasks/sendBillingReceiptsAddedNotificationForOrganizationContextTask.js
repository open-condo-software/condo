const dayjs = require('dayjs')
const get = require('lodash/get')
const groupBy = require('lodash/groupBy')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')
const { v4: uuid } = require('uuid')

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

const logger = getLogger('sendNewBillingReceiptNotification')

const makeMessageKey = (parentTaskId, period, accountNumber, categoryId, residentId) => `${parentTaskId}:${period}:${accountNumber}:${categoryId}:${residentId}`
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
 * @param {uuid} parentTaskId
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, receipt, resident, parentTaskId) => {
    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const locale = get(COUNTRIES, country).locale
    const notificationKey = makeMessageKey(parentTaskId, receipt.period, receipt.account.number, receipt.category.id, resident.id)
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

    return (isDuplicateMessage) ? 0 : 1
}

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param {BillingIntegrationOrganizationContext} context
 * @param {string} lastSync
 * @param {uuid} parentTaskId
 * @returns {Promise<void>}
 */
async function sendBillingReceiptsAddedNotificationForOrganizationContext (context, lastSync, parentTaskId) {
    const contextId = get(context, 'id')
    if (!contextId) throw new Error(`Invalid BillingIntegrationOrganizationContext, cannot get context.id. Context: ${context}`)
    const { prevMonthStart, thisMonthStart } = getStartDates()
    const { keystone } = getSchemaCtx('Message')
    const redisClient = getRedisClient()

    const receiptsWhere = {
        period_in: [prevMonthStart, thisMonthStart],
        createdAt_gt: lastSync,
        context: { id: contextId },
        deletedAt: null,
    }
    
    const receipts = await find('BillingReceipt', receiptsWhere)
    logger.info({
        msg: `found ${receipts.length} receipts by where: ${JSON.stringify(receiptsWhere)}`,
        parentTaskId,
        contextId,
    })
    const accountsNumbers = []
    const receiptAccountKeys = {}
    let successCount = 0

    for (const receipt of receipts) {
        //Calculate isPayable field of BillingReceipt
        const newerReceipts = await find('BillingReceipt', {
            account: { id: get(receipt, 'account'), deletedAt: null },
            OR: [
                { receiver: { AND: [{ id: get(receipt, 'receiver') }, { deletedAt: null } ] } },
                { category: { AND: [{ id: get(receipt, 'category') }, { deletedAt: null } ] } },
            ],
            period_gt: get(receipt, 'period'),
            deletedAt: null,
        })

        if (!newerReceipts.length) { // if isPayable, we collect data in a form that includes relations
            const account = await getById('BillingAccount', receipt.account)
            const billingProperty = await getById('BillingProperty', account.property)
            const category = await getById('BillingCategory', receipt.category)
            const processedReceipt = ({
                ...receipt,
                context,
                account: {
                    ...account,
                    property: { ...billingProperty },
                },
                category,
            })
            accountsNumbers.push(get(account, 'number'))
            receiptAccountKeys[makeAccountKey(get(billingProperty, 'addressKey'), get(account, 'number'))] ||= processedReceipt // A necessary and sufficient condition for notifying the user is one unpaid receipt in this period.
        }
    }

    const serviceConsumerWhere = {
        organization: { id: context.organization, deletedAt: null },
        accountNumber_in: accountsNumbers.filter(Boolean),
        deletedAt: null,
    }

    const rawServiceConsumers = await find('ServiceConsumer', serviceConsumerWhere)

    const residents = await find('Resident', {
        id_in: rawServiceConsumers.map(serviceConsumer => serviceConsumer.resident),
        deletedAt: null,
    })

    const residentsFilteredById = residents.reduce((acc, resident) => {
        acc[resident.id] = resident
        return acc
    }, {})

    const serviceConsumers = rawServiceConsumers.map(serviceConsumer => ({
        ...serviceConsumer,
        resident: residentsFilteredById[serviceConsumer.resident] || {},
    }))

    const consumersByAccountKey = groupBy(serviceConsumers, (item) => {
        const params = [
            get(item, 'resident.addressKey'),
            get(item, 'accountNumber'),
        ]

        return makeAccountKey(...params)
    })
    const lastReportDate = get(context, 'lastReport.finishTime')

    for (const [key, receipt] of Object.entries(receiptAccountKeys)) {
        const consumers = consumersByAccountKey[key]

        // We have no ServiceConsumer records for this receipt
        if (isEmpty(consumers)) continue

        let successConsumerCount = 0

        for (const consumer of consumers) {
            const resident = get(consumer, 'resident')

            // ServiceConsumer has no connection to Resident
            if (!resident || resident.deletedAt) continue

            // NOTE: (DOMA-4351) skip already notified user to get rid of duplicate notifications
            const notifiedUserDate = await redisClient.get(`BILLING_RECEIPTS_NOTIFIED_USERS${resident.user}`)

            if (dayjs(notifiedUserDate).isAfter(dayjs(lastReportDate))) continue

            const success = await prepareAndSendNotification(keystone, receipt, resident, parentTaskId)

            if (success){
                await redisClient.set(`BILLING_RECEIPTS_NOTIFIED_USERS${resident.user}`, dayjs().toISOString())
            }

            successConsumerCount += success
        }

        if (successConsumerCount > 0) successCount += 1
    }

    logger.info({ msg: 'sent billing receipts', successCount, parentTaskId, contextId })
}

const taskName = 'sendBillingReceiptsAddedNotificationForOrganizationContextTask'

module.exports = {
    [taskName]: createTask(taskName, sendBillingReceiptsAddedNotificationForOrganizationContext),
    sendBillingReceiptsAddedNotificationForOrganizationContext,
    makeMessageKey,
    makeAccountKey,
    getMessageTypeAndDebt,
}
