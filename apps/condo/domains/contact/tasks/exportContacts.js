const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { EXCEL, ERROR } = require('@condo/domains/common/constants/export')
const { TASK_WORKER_FINGERPRINT } = require('@condo/domains/common/constants/tasks')
const { buildExportFile: buildExportExcelFile, EXCEL_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { findAllByKey } = require('@condo/domains/common/utils/ecmascript.utils')
const { getHeadersTranslations, EXPORT_TYPE_CONTACTS } = require('@condo/domains/common/utils/exportToExcel')
const { exportRecordsAsXlsxFile, exportRecordsAsCsvFile } = require('@condo/domains/common/utils/serverSchema/export')
const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { ContactExportTask } = require('@condo/domains/contact/utils/serverSchema')
const { ContactRole, Contact } = require('@condo/domains/contact/utils/serverSchema')
const { buildContactsLoader } = require('@condo/domains/contact/utils/serverSchema')

const TASK_DV_AND_SENDER = {
    dv: 1, fingerprint: TASK_WORKER_FINGERPRINT,
}
const MAX_XLSX_FILE_ROWS = 10000
const DATE_FORMAT = 'DD.MM.YYYY'
const EMPTY_VALUE = '—'

const taskLogger = getLogger()

const contactToRow = ({ task, contact, translatedRolesMap }) => {
    const { locale } = task

    const unitType = contact.unitName ? i18n(`field.UnitType.${contact.unitType}`, { locale }) : ''
    const roleId = get(contact, 'role', null)
    return {
        name: contact.name,
        address: contact.property,
        unitName: contact.unitName,
        unitType,
        phone: contact.phone || EMPTY_VALUE,
        email: contact.email || EMPTY_VALUE,
        role: roleId ? translatedRolesMap[roleId] : EMPTY_VALUE,
        isVerified: i18n(contact.isVerified ? 'Yes' : 'No', { locale }),
    }
}

const buildExportFile = async ({ rows, task }) => {
    const { where, timeZone, locale, id } = task
    const createdAtGte = get(findAllByKey(where, 'createdAt_gte'), 0)
    const createdAtLte = get(findAllByKey(where, 'createdAt_lte'), 0)

    const formatDate = (date) => dayjs(date).tz(timeZone).format(DATE_FORMAT)

    let headerMessage = i18n('excelExport.header.contacts.forAllTime', { locale })
    if (createdAtGte && createdAtLte) {
        headerMessage = `${i18n('excelExport.header.contacts.forPeriod', { locale })} ${formatDate(createdAtGte)} — ${formatDate(createdAtLte)}`
    }

    const { stream } = await buildExportExcelFile({
        templatePath: './domains/contact/templates/ContactsExportTemplate.xlsx',
        replaces: {
            header: headerMessage,
            contacts: rows,
            i18n: {
                ...getHeadersTranslations(EXPORT_TYPE_CONTACTS, locale),
                sheetName: i18n('excelExport.sheetNames.contacts', { locale }),
            },
        },
    })

    return {
        stream,
        filename: `contacts_${dayjs().format('DD_MM')}.xlsx`,
        mimetype: EXCEL_FILE_META.mimetype,
        encoding: EXCEL_FILE_META.encoding,
        meta: {
            listkey: 'ContactExportTask',
            id,
        },
    }
}

async function exportContacts (taskId) {
    if (!taskId) throw new Error('taskId is required')
    const { keystone: context } = getSchemaCtx('ContactExportTask')

    const task = await ContactExportTask.getOne(context, { id: taskId }, 'id timeZone format where sortBy locale')
    const { format, where, sortBy } = task

    const baseAttrs = { dv: 1, sender: TASK_DV_AND_SENDER }

    if (!task.locale) {
        taskLogger.error({
            msg: 'ContactExportTask doesn\'t have value for "locale" field',
            entityId: taskId,
            entity: 'ContactExportTask',
        })
        await ContactExportTask.update(context, taskId, {
            ...baseAttrs,
            status: ERROR,
        })

        return
    }

    try {
        setLocaleForKeystoneContext(context, task.locale)

        const allRoles = await ContactRole.getAll(context, {
            deletedAt: null,
            OR: [
                { organization_is_null: true },
                { organization: { id: where.organization.id } },
            ],
        }, 'id name')
        const translatedRolesMap = Object.fromEntries(allRoles.map(role => ([role.id, role.name])))

        const contactLoader = await buildContactsLoader({ where, sortBy })
        const totalRecordsCount = await Contact.count(context, where)

        const loadRecordsBatch = async (offset, limit) => {
            const contacts = await contactLoader.loadChunk(offset, limit)

            this.progress(Math.floor(offset / totalRecordsCount * 100))

            return contacts
        }

        const convertRecordToFileRow = (contact) => contactToRow({
            task, contact, translatedRolesMap,
        })

        switch (format) {
            case EXCEL: {
                if (totalRecordsCount > MAX_XLSX_FILE_ROWS) {
                    await exportRecordsAsCsvFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        baseAttrs,
                        taskServerUtils: ContactExportTask,
                        totalRecordsCount,
                        taskId,
                        registry: EXPORT_TYPE_CONTACTS,
                    })
                } else {
                    await exportRecordsAsXlsxFile({
                        context,
                        loadRecordsBatch,
                        convertRecordToFileRow,
                        buildExportFile: (rows) => buildExportFile({ rows, task }),
                        baseAttrs,
                        taskServerUtils: ContactExportTask,
                        totalRecordsCount,
                        taskId,
                    })
                }
                break
            }
        }
    } catch (err) {
        taskLogger.error({
            msg: 'failed to export contacts',
            entityId: taskId,
            entity: 'ContactExportTask',
            err,
        })
        throw err
    }
}

module.exports = {
    exportContacts: createTask('exportContacts', exportContacts, 'low'),
}
