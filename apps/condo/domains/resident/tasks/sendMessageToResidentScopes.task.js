const { isArray, isEmpty, compact, get, omit, uniq } = require('lodash')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { MESSAGE_META } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const {
    fillDataByMessageTypeMeta,
    renderTemplateString, hydrateItems,
} = require('@condo/domains/resident/tasks/helpers/messageTools')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const CHUNK_SIZE = 20
const logger = getLogger('sendMessageToResidentScopes.task')

/**
 * Please have a look at SendResidentMessageService for json structure
 * @param json
 * @returns {Promise<{attemptsCount: (*), successCount: number}|{attemptsCount: number, successCount: number, json, error: Error}>}
 */
const sendMessageToResidentScopes = async (json) => {
    const taskId = this.id || uuid()
    let data

    try {
        data = JSON.parse(json)
    } catch (error) {
        logger.error({ msg: 'Error parsing JSON.', err: error.message, taskId })

        return { attemptsCount: 0, successCount: 0, error, json }
    }

    // TODO(DOMA-5910): Validate json structure

    const { scopes, uniqKeyTemplate, type: messageType } = data
    const residentsWhere = { deletedAt: null }
    const { keystone: context } = await getSchemaCtx('Resident')

    if (isArray(scopes)) {
        const residentPropertyIds = uniq(compact(scopes.map(({ property }) => get(property, 'id'))))

        residentsWhere.property = { 'id_in': residentPropertyIds }
    }

    // no properties or billingProperties found, can not continue
    if (isEmpty(residentsWhere.property.id_in)) {
        logger.error({ msg: 'no properties found for', scopes, taskId })

        return { successCount: 0, attemptsCount: 0, error: new Error('No properties found'), json }
    }

    const residentsCount = await Resident.count(context, residentsWhere)
    let skip = 0, successCount = 0, skippedDuplicates = 0

    while (skip < residentsCount) {
        // TODO(DOMA-5824): priority on sorting by flats & apartments (sortBy: ['unitType_ASC'], add index on unitType for Resident model)
        const residents = await Resident.getAll(context, residentsWhere, { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip })

        if (isEmpty(residents)) break

        skip += residents.length

        for (const resident of residents) {
            const templateData = { userId: resident.user.id, residentId: resident.id, propertyId: resident.property.id }
            const meta = hydrateItems(get(data, 'meta', {}), templateData)
            const metaData = hydrateItems(get(data, 'meta.data', {}), templateData)
            const { title, message } = meta
            const country = get(resident, 'residentOrganization.country', conf.DEFAULT_LOCALE)
            const locale = get(resident, 'user.locale') || get(COUNTRIES, country).locale
            const fullMetaData = { ...templateData, ...metaData }
            const notificationKey = uniqKeyTemplate ? renderTemplateString(uniqKeyTemplate, fullMetaData) : null
            const fullMeta = omit({ ...templateData, ...meta }, ['data'])
            const notificationMetaData = fillDataByMessageTypeMeta(messageType, fullMetaData, ['data'])

            const notificationMeta = {
                ...fillDataByMessageTypeMeta(messageType, fullMeta),
                dv: 1,
                data: notificationMetaData,
            }

            const messageData = {
                lang: locale,
                to: { user: { id: resident.user.id } },
                type: messageType,
                meta: notificationMeta,
                sender: { dv: 1, fingerprint: 'send-resident-message' },
                organization: resident.organization && { id: resident.organization.id },
            }

            if (notificationKey) messageData.uniqKey = notificationKey
            if (MESSAGE_META[messageType].title) messageData.meta.title = title
            if (MESSAGE_META[messageType].subject) messageData.meta.subject = title
            if (MESSAGE_META[messageType].body) messageData.meta.body = message

            const { isDuplicateMessage } = await sendMessage(context, messageData)

            skippedDuplicates += (isDuplicateMessage) ? 1 : 0
            successCount += (isDuplicateMessage) ? 0 : 1
        }
    }

    logger.info({ msg: 'notifications sent', successCount, attemptsCount: residentsCount, skippedDuplicates, taskId })

    return { successCount, attemptsCount: residentsCount, skippedDuplicates }
}

const sendMessageToResidentScopesTask = createTask('sendMessageToResidentScopesTask', sendMessageToResidentScopes)

module.exports = {
    sendMessageToResidentScopesTask,
}