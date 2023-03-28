const { isArray, isEmpty, compact, get, uniq } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { BillingProperty, BillingCategory } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { MESSAGE_META } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const CHUNK_SIZE = 20
const logger = getLogger('sendResidentMessage')

/**
 * Renders url from template by replacing {key} instances by data[key] values
 * @param templateString
 * @param data
 * @returns {*}
 */
const renderTemplateString = (templateString, data) => {
    const keys = Object.keys(data)
    let result = templateString

    for (const urlKey of keys) {
        const value = get(data, urlKey)

        if (value) result = result.replace(`{${urlKey}}`, value)
    }

    return result
}

/**
 * Fills notification payload from request data according to message meta settings by selected notification type
 * @param messageType
 * @param notificationData
 * @param data
 */
const fillExtraData = (messageType, notificationData) => {
    const metaKeys = Object.keys(get(MESSAGE_META[messageType], 'data', {}))
    const result = {}

    for (const fieldKey of metaKeys) {
        const value = get(notificationData, fieldKey)

        if (value) result[fieldKey] = value
    }

    return result
}

/**
 * Please have a look at SendResidentMessageService for json structure
 * @param json
 * @returns {Promise<{attemptsCount: (*), successCount: number}|{attemptsCount: number, successCount: number, json, error: Error}>}
 */
const sendResidentMessage = async (json) => {
    let data

    try {
        data = JSON.parse(json)
    } catch (error) {
        logger.error({ msg: 'Error parsing JSON.', error: error.message })

        return { attemptsCount: 0, successCount: 0, error, json }
    }

    const { organizationId, propertyDetails, uniqKeyTemplate, type: messageType, data: notificationData = {} } = data
    const { title, message, urlTemplate, categoryId } = notificationData
    const residentsWhere = { organization: { id: organizationId }, deletedAt: null }
    const { keystone: context } = await getSchemaCtx('BillingProperty')
    let category = {}

    if (categoryId) {
        category = await BillingCategory.getOne(context, { id: categoryId })

        if (isEmpty(category)) {
            logger.error({ msg: 'Category id is unknown', categoryId })

            return { attemptsCount: 0, successCount: 0, error: new Error(`Category id is unknown: ${categoryId}`), json }
        }
    }

    if (isArray(propertyDetails)) {
        const billingPropertyIds = uniq(compact(propertyDetails.map(({ billingPropertyId }) => billingPropertyId)))
        let propertiesFromBilling = []

        // details have some billingProperties, so we should convert billingPropertyIds to propertyIds
        if (!isEmpty(billingPropertyIds)) {
            const billingPropertyWhere = {
                id_in: billingPropertyIds,
                deletedAt: null,
            }
            const billingProperties = await loadListByChunks({ context, list: BillingProperty, where: billingPropertyWhere })

            if (!isEmpty(billingProperties)) {
                const addresses = uniq(compact(billingProperties.map(({ normalizedAddress }) => normalizedAddress)))
                const addresses1 = uniq(compact(billingProperties.map(({ address }) => address)))
                const propertiesWhere = {
                    organization: { id: organizationId },
                    address_in: uniq(addresses.concat(addresses1)),
                    deletedAt: null,
                }
                const properties = await loadListByChunks({ context, list: Property, where: propertiesWhere })

                if (!isEmpty(properties)) propertiesFromBilling = properties.map(({ id }) => id)
            }
        }

        const residentPropertyIds = uniq(compact(propertyDetails.map(({ propertyId }) => propertyId).concat(propertiesFromBilling)))

        residentsWhere.property = { 'id_in': residentPropertyIds }
    }

    // no properties or billingProperties found, can not continue
    if (isEmpty(residentsWhere.property.id_in)) {
        logger.error({ msg: 'no properties found for', propertyDetails, organizationId })

        return { successCount: 0, attemptsCount: 0, error: new Error('No properties found'), json }
    }

    const residentsCount = await Resident.count(context, residentsWhere)
    let skip = 0, successCount = 0, skippedDuplicates = 0

    while (skip < residentsCount) {
        // TODO: приоритет сортировки квартиры и аппартаменты (sortBy: ['unitType_ASC'], add index on unitType for Resident model)
        const residents = await Resident.getAll(context, residentsWhere, { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip })

        if (isEmpty(residents)) break

        skip += residents.length

        for (const resident of residents) {
            const templateData = { categoryId, userId: resident.user.id, residentId: resident.id }
            const url = urlTemplate ? renderTemplateString(urlTemplate, templateData) : null
            const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
            const locale = get(COUNTRIES, country).locale
            const notificationKey = uniqKeyTemplate ? renderTemplateString(uniqKeyTemplate, templateData) : null

            const data = {
                residentId: resident.id,
                userId: resident.user.id,
                url,
                ...fillExtraData(messageType, notificationData),
            }

            const messageData = {
                lang: locale,
                to: { user: { id: resident.user.id } },
                type: messageType,
                meta: { dv: 1, data },
                sender: { dv: 1, fingerprint: 'send-resident-message' },
                uniqKey: notificationKey,
                organization: resident.organization && { id: resident.organization.id },
            }

            if (MESSAGE_META[messageType].title) messageData.meta.title = title
            if (MESSAGE_META[messageType].subject) messageData.meta.subject = title
            if (MESSAGE_META[messageType].body) messageData.meta.body = message
            if (notificationData.category) messageData.meta.categoryName = i18n(category.nameNonLocalized, locale)

            const { isDuplicateMessage } = await sendMessage(context, messageData)

            skippedDuplicates += (isDuplicateMessage) ? 1 : 0
            successCount += (isDuplicateMessage) ? 0 : 1
        }
    }

    logger.info({ msg: 'notifications sent', successCount, attemptsCount: residentsCount, skippedDuplicates })

    return { successCount, attemptsCount: residentsCount, skippedDuplicates }
}

module.exports = {
    sendResidentMessage,
}