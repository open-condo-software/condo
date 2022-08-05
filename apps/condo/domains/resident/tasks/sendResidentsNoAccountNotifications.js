const pino = require('pino')
const falsey = require('falsey')
const { get, isEmpty, uniq } = require('lodash')
const dayjs = require('dayjs')

const conf = require('@core/config')
const { getSchemaCtx } = require('@core/keystone/schema')
const { getRedisClient } = require('@core/keystone/redis')

const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { getStartDates, DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

const { BillingIntegrationOrganizationContext, BillingProperty, BillingReceipt, BillingAccount } = require('@condo/domains/billing/utils/serverSchema')

const { BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const REDIS_LAST_DATE_KEY = 'LAST_SEND_RESIDENTS_NO_ACCOUNT_NOTIFICATION_CREATED_AT'

const logger = pino({
    name: 'send_residents_no_account_billing_receipt_added_notifications',
    enabled: falsey(process.env.DISABLE_LOGGING),
})

const makeMessageKey = (period, propertyId, residentId) => `${period}:${propertyId}:${residentId}`

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param context
 * @param resident
 * @param period
 * @returns {Promise<boolean>}
 */
const prepareAndSendNotification = async (context, resident, period) => {
    if (isEmpty(resident)) throw new Error('resident is required to send message')
    if (isEmpty(period)) throw new Error('period is required to send message')

    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country')
    const locale = get(COUNTRIES, country || DEFAULT_LOCALE).locale
    const notificationKey = makeMessageKey(period, resident.property.id, resident.id)
    const organizationId = get(resident, 'residentOrganization.id')

    const data = {
        residentId: resident.id,
        userId: resident.user.id,
        url: `${conf.SERVER_URL}/billing/receipts`,
        propertyId: resident.property.id,
        period,
    }

    const messageType = BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE
    const messageData = {
        lang: locale,
        to: { user: { id: resident.user.id } },
        type: messageType,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-residents-no-account-notifications' },
        uniqKey: notificationKey,
        organization: organizationId && { connect: { id: organizationId } },
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

const makeAddress = (address, unitType, unitName) => `${address}:${unitType}:${unitName}`

/**
 * Detects all properties that have new billing receipts,
 * then detects all residents within that properties that haven't added account numbers yet,
 * and tries to send notifications to that residents.
 * @param billingContext
 * @param receiptsWhere
 * @returns {Promise<void>}
 */
const sendResidentsNoAccountNotificationsForContext = async (billingContext, receiptsWhere) => {
    const { keystone: context } = await getSchemaCtx('Resident')

    const billingPropertiesWhere = { context: { id: billingContext.id }, deletedAt: null }
    const billingProperties = await loadListByChunks({ context, list: BillingProperty, where: billingPropertiesWhere })

    if (isEmpty(billingProperties)) return

    let successCnt = 0, attempts = 0, processedCount = 0

    for (const billingProperty of billingProperties) {

        if (!billingProperty.property) continue

        const receiptsCountWhere = { ...receiptsWhere, property: { id: billingProperty.id } }
        const receiptsCount = await BillingReceipt.count(context, receiptsCountWhere)

        if (receiptsCount < 1) continue

        const accountsWhere = { property: { id: billingProperty.id, deletedAt: null }, deletedAt: null }
        const accounts = await loadListByChunks({ context, list: BillingAccount, where: accountsWhere })
        const accountNumbers = uniq(accounts.map(accounts => get(accounts, 'number')))
        const accountsByAddresses = accounts.reduce(
            (result, account) => {
                const fullAddress = makeAddress(get(account, 'property.address'), account.unitType, account.name)

                result[fullAddress] = account

                return result
            }, {}
        )

        const serviceConsumersWhere = {
            billingIntegrationContext: { id: billingContext.id, deletedAt: null },
            organization: { id: billingContext.organization.id, deletedAt: null },
            accountNumber_in: accountNumbers,
            deletedAt: null,
        }
        const serviceConsumers = await loadListByChunks({ context, list: ServiceConsumer, where: serviceConsumersWhere })
        const scResidentIds = uniq(serviceConsumers.map(sc => get(sc, 'resident.id')).filter(Boolean))

        const residentsWhere = {
            organization: { id: billingContext.organization.id, deletedAt: null },
            property: { id: billingProperty.property.id, deletedAt: null },
            id_not_in: scResidentIds,
            deletedAt: null,
        }
        const residentsCount = await Resident.count(context, residentsWhere )

        logger.info({
            message: 'Found data for property:',
            receiptsCount,
            address: billingProperty.address,
            propertyId: billingProperty.id,
            accounts: accounts.length,
            serviceConsumers: serviceConsumers.length,
            residentsWithSC: scResidentIds.length,
            residentsCount,
        })

        if (residentsCount < 1) continue

        let skip = 0

        processedCount += residentsCount

        while (skip < residentsCount) {
            const residents = await Resident.getAll(context, residentsWhere, { sortBy: ['createdAt_ASC'], first: 100, skip })

            skip += residents.length

            for (const resident of residents) {
                const fullAddress = makeAddress(get(resident, 'residentProperty.address'), resident.unitType, resident.name)
                // Here we want to send notifications only to residents, that have accounts but no service consumers added for corresponding property
                if (!accountsByAddresses[fullAddress]) continue

                const success = await prepareAndSendNotification(context, resident, receiptsWhere.period_in[0])

                successCnt += success
                attempts += 1
            }
        }
    }

    logger.info({ message: 'Notifications sent:', successCnt, attempts, processedCount })
}

/**
 * sends notifications to all residents without accounts added within properties with newly added billing receipts for provided period
 * @param period
 * @param billingContextId
 * @param resendFromDt
 * @returns {Promise<void>}
 */
const sendResidentsNoAccountNotificationsForPeriod = async (period, billingContextId, resendFromDt) => {
    const { keystone: context } = await getSchemaCtx('Resident')
    const redisClient = getRedisClient()

    const { thisMonthStart } = getStartDates()
    const today = dayjs().format(DATE_FORMAT_Z)
    const requestPeriod = period || thisMonthStart
    const contextWhere = { status: CONTEXT_FINISHED_STATUS, deletedAt: null }
    const billingContexts = billingContextId
        ? [ await BillingIntegrationOrganizationContext.getOne(context, { id: billingContextId, ...contextWhere }) ]
        : await loadListByChunks({ context, list: BillingIntegrationOrganizationContext, where: contextWhere })

    if (isEmpty(billingContexts) || isEmpty(billingContexts[0])) {
        throw new Error('Provided context is not in finished status or invalid.')
    }

    logger.info({ message: 'Billing context to proceed:', count: billingContexts.length, requestPeriod })

    for (const billingContext of billingContexts) {
        const redisVarName = `${REDIS_LAST_DATE_KEY}-${period}-${billingContext.id}`

        /**
         * This represents min value for billingReceipt createdAt to start processing from
         * 1. First of all use resendFromDt from CLI parameter if available, else
         * 2. Use createdAt value from last success script execution stored in Redis, else
         * 3. Use thisMonthStart
         */
        const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : await redisClient.get(redisVarName) || thisMonthStart

        const receiptsWhere = {
            period_in: [requestPeriod],
            createdAt_gt: lastDt,
            context: { id: billingContext.id },
            deletedAt: null,
        }

        logger.info({ message: 'Processing data for:', organization: billingContext.organization.name, organizationId: billingContext.organization.id })

        await sendResidentsNoAccountNotificationsForContext(billingContext, receiptsWhere)
        /**
         * Store datetime for period + billingContext, so that for next execution continue from billing receipts added after this datetime moment.
         */
        await redisClient.set(redisVarName, today)
    }
}

/**
 * Sends notifications to residents without accounts on properties with newly added billing receipts for actual periods
 * @returns {Promise<void>}
 */
const sendResidentsNoAccountNotifications = async () => {
    const { thisMonthStart, prevMonthStart } = getStartDates()
    const currentDay = Number(dayjs().format('DD'))
    const periods = currentDay < 20 ? [prevMonthStart, thisMonthStart] : [thisMonthStart]

    for (const period in periods) await sendResidentsNoAccountNotificationsForPeriod(period)
}

module.exports = {
    sendResidentsNoAccountNotifications,
    sendResidentsNoAccountNotificationsForPeriod,
    makeMessageKey,
}