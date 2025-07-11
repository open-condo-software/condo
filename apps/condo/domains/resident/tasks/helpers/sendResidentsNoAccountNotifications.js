const dayjs = require('dayjs')
const { get, isEmpty, uniq } = require('lodash')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BillingIntegrationOrganizationContext, BillingProperty, BillingReceipt, BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { getStartDates, DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PAYMENT_CATEGORIES_META } = require('@condo/domains/resident/constants')
const { REDIS_LAST_DATE_KEY } = require('@condo/domains/resident/constants/constants')
const { Resident, ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')

const CATEGORY_ID = '928c97ef-5289-4daa-b80e-4b9fed50c629' // billing.category.housing.name
const INVALID_CONTEXT_PROVIDED_ERROR = 'Provided context is not in finished status, invalid or skipped.'

const logger = getLogger()

const makeMessageKey = (period, propertyId, residentId) => `${period}:${propertyId}:${residentId}`

/**
 * Prepares data for sendMessage to resident on available billing receipt, then tries to send the message
 * @param context
 * @param resident
 * @param period
 * @returns {Promise<number>}
 */
const prepareAndSendNotification = async (context, resident, period) => {
    if (isEmpty(resident)) throw new Error('resident is required to send message')
    if (isEmpty(period)) throw new Error('period is required to send message')

    // TODO(DOMA-3376): Detect locale by resident locale instead of organization country.
    const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
    const tin = get(resident, 'residentOrganization.tin')
    const locale = get(COUNTRIES, country).locale
    const notificationKey = makeMessageKey(period, resident.property.id, resident.id)
    const organizationId = get(resident, 'residentOrganization.id')
    // TODO(DOMA-5729): Get rid of PAYMENT_CATEGORIES_META
    const paymentCategoryData = PAYMENT_CATEGORIES_META.find(item => item.uuid === CATEGORY_ID)
    const paymentCategoryId = get(paymentCategoryData, 'id', null)
    const url = `${conf.SERVER_URL}/payments/addaccount/?residentId=${resident.id}&categoryId=${paymentCategoryId}&organizationTIN=${tin}`

    const data = {
        residentId: resident.id,
        userId: resident.user.id,
        url,
        propertyId: resident.property.id,
        period,
    }

    const messageData = {
        lang: locale,
        to: { user: { id: resident.user.id } },
        type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
        meta: { dv: 1, data },
        sender: { dv: 1, fingerprint: 'send-residents-no-account-notifications' },
        uniqKey: notificationKey,
        organization: organizationId && { id: organizationId },
    }

    const { isDuplicateMessage } = await sendMessage(context, messageData)

    return (isDuplicateMessage) ? 0 : 1
}

const makeAddress = (address, unitType, unitName) => `${address}:${unitType}:${unitName}`.toLowerCase()

/**
 * Detects all properties that have new billing receipts,
 * then detects all residents within that properties that haven't added account numbers yet,
 * and tries to send notifications to that residents.
 * @param billingContext
 * @param receiptsWhere
 * @returns {Promise<{attemptsCount: number, processedCount: number, successCount: number}>}
 */
const sendResidentsNoAccountNotificationsForContext = async (billingContext, receiptsWhere) => {
    const { keystone: context } = await getSchemaCtx('Resident')

    const billingPropertiesWhere = { context: { id: billingContext.id }, deletedAt: null }
    const billingProperties = await loadListByChunks({
        context, list: BillingProperty, where: billingPropertiesWhere,
        fields: 'id address property { id }',
    })

    let successCount = 0, attemptsCount = 0, processedCount = 0

    if (isEmpty(billingProperties)) return { successCount, attemptsCount, processedCount }

    for (const billingProperty of billingProperties) {

        if (!billingProperty.property) continue

        const receiptsCountWhere = { ...receiptsWhere, property: { id: billingProperty.id } }
        const receiptsCount = await BillingReceipt.count(context, receiptsCountWhere)

        if (receiptsCount < 1) continue

        const accountsWhere = { property: { id: billingProperty.id, deletedAt: null }, deletedAt: null }
        const accounts = await loadListByChunks({
            context, list: BillingAccount, where: accountsWhere,
            fields: 'id number unitName unitType property { id address }',
        })
        const accountNumbers = uniq(accounts.map(account => get(account, 'number')))
        const accountsByAddresses = accounts.reduce(
            (result, account) => {
                const fullAddress = makeAddress(get(account, 'property.address'), account.unitType, account.unitName)

                result[fullAddress] = account

                return result
            }, {}
        )

        const serviceConsumersWhere = {
            organization: { id: billingContext.organization.id, deletedAt: null },
            accountNumber_in: accountNumbers,
            deletedAt: null,
            resident: { deletedAt: null },
        }
        const serviceConsumers = await loadListByChunks({
            context,
            chunkSize: 50,
            list: ServiceConsumer,
            where: serviceConsumersWhere,
            fields: 'id resident { id }',
        })
        const scResidentIds = uniq(serviceConsumers.map(sc => get(sc, 'resident.id')).filter(Boolean))

        const residentsWhere = {
            organization: { id: billingContext.organization.id, deletedAt: null },
            property: { id: billingProperty.property.id, deletedAt: null },
            id_not_in: scResidentIds,
            deletedAt: null,
        }
        const residentsCount = await Resident.count(context, residentsWhere )

        logger.info({
            msg: 'found data for property',
            entityId: billingProperty.id,
            entity: 'BillingProperty',
            data: {
                address: billingProperty.address,
                receiptsCount,
                accountsCount: accounts.length,
                serviceConsumersCount: serviceConsumers.length,
                residentsWithServiceConsumerCount: scResidentIds.length,
                residentsCount,
            },

        })

        if (residentsCount < 1) continue

        let skip = 0

        processedCount += residentsCount

        while (skip < residentsCount) {
            const residents = await Resident.getAll(context,
                residentsWhere,
                'id residentOrganization { id country tin } property { id }' +
                ' residentProperty { address } user { id } unitType unitName',
                { sortBy: ['createdAt_ASC'], first: 100, skip }
            )

            skip += residents.length

            for (const resident of residents) {
                const fullAddress = makeAddress(get(resident, 'residentProperty.address'), resident.unitType, resident.unitName)

                // Here we want to send notifications only to residents, that have accounts but no service consumers added for corresponding property
                if (!accountsByAddresses[fullAddress]) continue

                const success = await prepareAndSendNotification(context, resident, receiptsWhere.period_in[0])

                successCount += success
                attemptsCount += 1
            }
        }
    }

    logger.info({ msg: 'notifications sent', count: successCount, data: { successCount, attemptsCount, processedCount } })

    return { successCount, attemptsCount, processedCount }
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
    const redisClient = getKVClient()

    const { thisMonthStart } = getStartDates()
    const today = dayjs().format(DATE_FORMAT_Z)

    const requestPeriod = period || thisMonthStart
    const contextWhere = {
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    }
    const fields = 'id integration { id skipNoAccountNotifications } organization { id }'
    const billingContexts = billingContextId
        ? [ await BillingIntegrationOrganizationContext.getOne(context, { id: billingContextId, ...contextWhere }, fields) ]
        : await loadListByChunks({ context, list: BillingIntegrationOrganizationContext, where: contextWhere, fields })

    if (isEmpty(billingContexts) || isEmpty(billingContexts[0])) throw new Error(INVALID_CONTEXT_PROVIDED_ERROR)

    logger.info({
        msg: 'billing context proceed',
        count: billingContexts.length,
        entityId: billingContextId,
        entity: 'BillingIntegrationOrganizationContext',
        data: {
            requestPeriod,
        },
    })

    let totalSuccessCount = 0, totalAttemptsCount = 0, totalProcessedCount = 0

    for (const billingContext of billingContexts) {
        if (billingContext.integration.skipNoAccountNotifications) {
            logger.info({
                msg: 'skipping billing context due to enabled integration skipNoAccountNotifications flag',
                entityId: billingContext.id,
                entity: 'BillingIntegrationOrganizationContext',
                data: {
                    integrationId: billingContext.integration.id,
                },
            })

            continue
        }

        const redisVarName = `${REDIS_LAST_DATE_KEY}-${requestPeriod}-${billingContext.id}`

        /**
         * This represents min value for billingReceipt createdAt to start processing from
         * 1. First of all use resendFromDt from CLI parameter if available, else
         * 2. Use createdAt value from last success script execution stored in Redis, else
         * 3. Use thisMonthStart
         */
        const storedLastDt = await redisClient.get(redisVarName)

        logger.info({ msg: 'storedLastDt', data: { key: redisVarName, value: storedLastDt } })

        const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : storedLastDt || thisMonthStart

        const receiptsWhere = {
            period_in: [requestPeriod],
            createdAt_gt: lastDt,
            context: { id: billingContext.id },
            deletedAt: null,
        }

        logger.info({
            msg: 'processing',
            data: {
                organizationId: billingContext.organization.id,
                receiptsWhere,
            },
            entityId: billingContextId,
            entity: 'BillingIntegrationOrganizationContext',

        })

        const { successCount, attemptsCount, processedCount } = await sendResidentsNoAccountNotificationsForContext(billingContext, receiptsWhere)

        totalSuccessCount += successCount
        totalAttemptsCount += attemptsCount
        totalProcessedCount += processedCount

        /**
         * Store datetime for period + billingContext, so that for next execution continue from billing receipts added after this datetime moment.
         */
        await redisClient.set(redisVarName, today)
    }

    logger.info({ msg: 'total', count: totalSuccessCount, data: { totalSuccessCount, totalAttemptsCount, totalProcessedCount } })
}

/**
 * Sends notifications to residents without accounts on properties with newly added billing receipts for actual periods
 * @param resendFromDt
 * @returns {Promise<void>}
 */
const sendResidentsNoAccountNotifications = async (resendFromDt) => {
    const { prevMonthStart, thisMonthStart } = getStartDates()
    const periods = [prevMonthStart, thisMonthStart]

    for (const period of periods) await sendResidentsNoAccountNotificationsForPeriod(period, undefined, resendFromDt)
}

module.exports = {
    sendResidentsNoAccountNotifications,
    sendResidentsNoAccountNotificationsForPeriod,
    makeMessageKey,
    INVALID_CONTEXT_PROVIDED_ERROR,
}
