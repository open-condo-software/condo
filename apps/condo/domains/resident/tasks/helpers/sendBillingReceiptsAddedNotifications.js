const { get, compact, isEmpty, isFunction, uniq, groupBy, isNull } = require('lodash')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx, allItemsQueryByChunks, find, getById } = require('@open-condo/keystone/schema')
const { getLocalized } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { CURRENCY_SYMBOLS, DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')
const { getStartDates } = require('@condo/domains/common/utils/date')
const {
    BILLING_RECEIPT_ADDED_TYPE,
    // BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')


const REDIS_LAST_DATE_KEY = 'LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT'
const BILLING_RECEIPT_FIELDS = '{ id deletedAt createdAt isPayable period toPay context { id integration { id currencyCode } organization { id } } property { id address addressKey } account { id number unitType unitName fullName property { address } } toPayDetails { charge } category { id nameNonLocalized } }'
const BillingReceiptGQL = generateGqlQueries('BillingReceipt', BILLING_RECEIPT_FIELDS)
const BillingReceipt = generateServerUtils(BillingReceiptGQL)
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
 * @param context
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
    const category = getLocalized(locale, receipt.category.name)
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
        organization: resident.organization && { id: resident.organization },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return (isDuplicateMessage) ? 0 : 1
}

/**
 * Reads by portions all data required to send notifications to residents on available billing receipts and sends notifications
 * @param receiptsWhere
 * @param onLastDtChange
 * @param taskId
 * @returns {Promise<void>}
 */
const sendBillingReceiptsAddedNotificationsForPeriod = async (receiptsWhere, onLastDtChange, taskId) => {
    const { keystone: context } = getSchemaCtx('Resident')
    let successCount = 0
    const notifiedUsers = new Set()

    let lastReceipt
    await allItemsQueryByChunks({
        schemaName: 'BillingReceipt',
        chunkSize: CHUNK_SIZE,
        where: receiptsWhere,
        /**
         * @param {BillingReceipt[]} receipts
         * @returns {[]}
         */
        chunkProcessor: async (receipts) => {
            const processedReceipts = []
            const accountsNumbers = []
            const organisationIds = []
            const receiptAccountKeys = {}

            for (const receipt of receipts) {
                //Calculate isPayable field of BillingReceipt
                const otherReceiptsInThatPeriod = await find('BillingReceipt', {
                    account: { id: get(receipt, 'account'), deletedAt: null },
                    OR: [
                        { receiver: { AND: [{ id: get(receipt, 'receiver') }, { deletedAt: null } ] } },
                        { category: { AND: [{ id: get(receipt, 'category') }, { deletedAt: null } ] } },
                    ],
                    period_gt: get(receipt, 'period'),
                    deletedAt: null,
                })

                if (!(otherReceiptsInThatPeriod && otherReceiptsInThatPeriod.length)) { // if isPayable, we collect data in a form that includes relations
                    const account = await getById('BillingAccount', receipt.account)
                    const billingProperty = await getById('BillingProperty', account.property)
                    const context = await getById('BillingIntegrationOrganizationContext', receipt.context)
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
                    organisationIds.push(get(context, 'organization'))
                    accountsNumbers.push(get(account, 'number'))
                    receiptAccountKeys[makeAccountKey(get(billingProperty, 'address'), get(account, 'number'))] ||= processedReceipt // A necessary and sufficient condition for notifying the user is one unpaid receipt in this period.
                }
            }

            const serviceConsumerWhere = {
                organization: { id_in:  uniq(organisationIds) },
                accountNumber_in: compact(accountsNumbers),
                deletedAt: null,
            }
            const serviceConsumers = await allItemsQueryByChunks({
                schemaName: 'ServiceConsumer',
                where: serviceConsumerWhere,
                chunkProcessor: async chunk => {
                    const result = []
                    for (const serviceConsumer of chunk) {
                        serviceConsumer.resident = await getById('Resident', serviceConsumer.resident)
                        result.push(serviceConsumer)
                    }
                    return result
                },
            })

            const consumersByAccountKey = groupBy(serviceConsumers, (item) => {
                const params = [
                    get(item, 'resident.address'),
                    get(item, 'accountNumber'),
                ]

                return makeAccountKey(...params)
            })

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
                    if (notifiedUsers.has(resident.user)) continue

                    const success = await prepareAndSendNotification(context, receipt, resident)

                    if (success) notifiedUsers.add(resident.user)

                    successConsumerCount += success
                }

                if (successConsumerCount > 0) successCount += 1
                logger.info({ msg: `Processed ${CHUNK_SIZE} receipts.`, taskId })
                lastReceipt = receipt
            }

            return []
        },
    })

    // Store receipt.createdAt as lastDt in order to continue from this point on next execution
    if (isFunction(onLastDtChange) && !isEmpty(lastReceipt)) await onLastDtChange(lastReceipt.createdAt)

    logger.info({ msg: 'sent billing receipts', successCount, taskId })
}


const sendBillingReceiptsAddedNotifications = async (resendFromDt = null, taskId) => {
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
    await sendBillingReceiptsAddedNotificationsForPeriod(receiptsWhere, handleLastDtChange, taskId)
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
    sendBillingReceiptsAddedNotificationsForPeriod,
    makeMessageKey,
    makeAccountKey,
    getMessageTypeAndDebt,
}
