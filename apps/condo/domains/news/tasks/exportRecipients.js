const dayjs = require('dayjs')
const compact = require('lodash/compact')
const filter = require('lodash/filter')
const find = require('lodash/find')
const get = require('lodash/get')
const identity = require('lodash/identity')
const pick = require('lodash/pick')
const pickBy = require('lodash/pickBy')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { ERROR, COMPLETED } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { buildExportFile: buildExportExcelFile, EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { md5 } = require('@condo/domains/common/utils/crypto')
const { getHeadersTranslations, EXPORT_TYPE_NEWS_RECIPIENTS } = require('@condo/domains/common/utils/exportToExcel')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { queryFindResidentsByOrganizationAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { NewsItemRecipientsExportTask } = require('@condo/domains/news/utils/serverSchema')
const { getUnitsFromProperty } = require('@condo/domains/news/utils/serverSchema/recipientsCounterUtils')
const { PROPERTY_MAP_JSON_FIELDS } = require('@condo/domains/property/gql')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const logger = getLogger('exportNewsItemRecipients')
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: TASK_WORKER_FINGERPRINT } }

const buildExportFile = async ({ rows, locale }) => {
    const YesMessage = i18n('Yes', { locale })
    const NoMessage = i18n('No', { locale })
    const HeaderMessage = i18n('excelExport.sheetNames.recipients', { locale })

    const processedRows = rows.reduce((acc, row) => {
        row.hasResident = row.hasResident ? YesMessage : NoMessage
        return [...acc, row]
    }, [])

    const { stream } = await buildExportExcelFile({
        templatePath: './domains/news/templates/NewsRecipientsExportTemplate.xlsx',
        replaces: {
            header: HeaderMessage,
            newsRecipients: processedRows,
            i18n: {
                ...getHeadersTranslations(EXPORT_TYPE_NEWS_RECIPIENTS, locale),
                sheetName: i18n('excelExport.sheetNames.recipients', { locale }),
            },
        },
    })

    return {
        stream,
        filename: `news_item_recipients_${dayjs().format('DD_MM')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'NewsRecipients',
            id: md5(JSON.stringify(rows)),
        },
    }
}

/**
 * Processor for exporting recipients job
 *
 * @param taskId - id of `NewsItemRecipientsExportTask` record, obtained from job `data` arguments
 * @returns {Promise<void>}
 */
async function exportRecipients (taskId) {
    if (!taskId) {
        logger.error({ message: 'taskId is undefined' })
        throw new Error('taskId is undefined')
    }
    const { keystone: context } = getSchemaCtx('NewsItemRecipientsExportTask')

    const task = await NewsItemRecipientsExportTask.getOne(
        context,
        { id: taskId },
        'scopes organization { id } user { id locale }'
    )
    if (!task) {
        logger.error({ msg: `No task with id "${taskId}"` })
        throw new Error(`No task with id "${taskId}"`)
    }

    const {
        scopes: newsItemScopes,
        organization: { id: organizationId },
        user,
    } = task

    const locale = get(user, 'locale', conf.DEFAULT_LOCALE) || conf.DEFAULT_LOCALE

    try {
        /**
         * @type {{ property: PropertyWhereUniqueInput, unitType: String, unitName: String }[]}
         */
        const residentsData = []
        await loadListByChunks({
            context,
            list: Resident,
            chunkSize: 50,
            where: {
                ...queryFindResidentsByOrganizationAndScopes(organizationId, newsItemScopes),
                deletedAt: null,
            },
            fields: 'id property { id } unitType unitName',
            /**
             * @param {Resident[]} chunk
             * @returns {Resident[]}
             */
            chunkProcessor: (chunk) => {
                residentsData.push(...chunk.map((resident) => ({
                    property: { id: resident.property.id },
                    unitType: resident.unitType,
                    unitName: resident.unitName,
                })))

                return []
            },
        })

        const recipientsByNewsItemsScope = []
        const recipientsByOrganization = []
        const isAllOrganization = filter(newsItemScopes, { property: null, unitType: null, unitName: null }).length > 0

        if (isAllOrganization) {
            await loadListByChunks({
                context,
                list: Property,
                chunkSize: 50,
                where: {
                    organization: {
                        id: organizationId,
                    },
                    deletedAt: null,
                },
                fields: `id address map { ${PROPERTY_MAP_JSON_FIELDS} }`,
                /**
                 * @param {Property[]} chunk
                 * @returns {Property[]}
                 */
                chunkProcessor: (chunk) => {
                    for (const property of chunk) {
                        const units = getUnitsFromProperty(property)

                        const recipientsData = units.map(({ unitName, unitType }) => ({
                            address: property.address,
                            unitName,
                            unitType: i18n(`field.UnitType.${unitType}`, { locale }),
                            hasResident: !!find(residentsData, { unitName, unitType, property: { id: property.id } }),
                        }))
                        recipientsByOrganization.push(...recipientsData)
                    }

                    return []
                },
            })
        } else {
            const compactedNewsItemScopes = compact(newsItemScopes)
            const propertiesIds = new Set()
            for (let newsItemScope of compactedNewsItemScopes) {
                if (get(newsItemScope, 'property.id')) {
                    const property = await Property.getOne(context, {
                        id: newsItemScope.property.id,
                        deletedAt: null,
                    }, `id address map { ${PROPERTY_MAP_JSON_FIELDS} }`)

                    propertiesIds.add(property.id)

                    const units = getUnitsFromProperty(property)

                    const unitsFilter = pickBy(pick(newsItemScope, ['unitName', 'unitType']), identity)

                    const filteredUnits = filter(units, unitsFilter)
                    const filteredResidents = filter(residentsData, unitsFilter)
                    const recipientsData = filteredUnits.map(({ unitName, unitType }) => ({
                        address: property.address,
                        unitName,
                        unitType: i18n(`field.UnitType.${unitType}`, { locale }),
                        hasResident: !!find(filteredResidents, { unitName, unitType, property: { id: property.id } }),
                    }))
                    recipientsByNewsItemsScope.push(...recipientsData)
                }
            }
        }

        const unitsData = [...recipientsByNewsItemsScope, ...recipientsByOrganization]

        const file = buildUploadInputFrom(await buildExportFile({ rows: unitsData, locale }))
        await NewsItemRecipientsExportTask.update(context, taskId, { ...dvAndSender, status: COMPLETED, file })

    } catch (err) {
        await NewsItemRecipientsExportTask.update(context, taskId, { ...dvAndSender, status: ERROR })
        logger.error({ message: 'Failed to export incidents', data: { id: taskId }, err })
        throw err
    }
}

module.exports = {
    exportRecipients: createTask('exportRecipients', exportRecipients, 'low'),
}
