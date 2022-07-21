const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const access = require('@condo/domains/contact/access/ExportContactsService')
const { loadContactsForExcelExport } = require('@condo/domains/contact/utils/serverSchema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { getHeadersTranslations, EXPORT_TYPE_CONTACTS } = require('@condo/domains/common/utils/exportToExcel')
const { i18n } = require('@condo/domains/common/utils/localesLoader')
const { extractReqLocale } = require('@condo/domains/common/utils/locale')
const conf = require('@core/config')
const get = require('lodash/get')
const { ContactRole } = require('@condo/domains/contact/utils/serverSchema')

dayjs.extend(utc)
dayjs.extend(timezone)

const CONTACTS_EXPORT_TEMPLATE_PATH = './domains/contact/templates/ContactsExportTemplate.xlsx'

const errors = {
    NOTHING_TO_EXPORT: {
        query: 'exportContactsToExcel',
        code: BAD_USER_INPUT,
        type: NOTHING_TO_EXPORT,
        message: 'No contacts found to export',
        messageForUser: 'api.contact.exportContactsToExcel.NOTHING_TO_EXPORT',
    },
}

const ExportContactsService = new GQLCustomSchema('ExportContactsService', {
    types: [
        {
            access: true,
            type: 'input ExportContactsToExcelInput { dv: Int!, sender: SenderFieldInput!, where: ContactWhereInput!, sortBy: [SortContactsBy!] }',
        },
        {
            access: true,
            type: 'type ExportContactsToExcelOutput { status: String!, linkToFile: String! }',
        },
    ],
    queries: [
        {
            access: access.canExportContactsToExcel,
            schema: 'exportContactsToExcel(data: ExportContactsToExcelInput!): ExportContactsToExcelOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { where, sortBy } = args.data
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE

                // role name has LocalizedText type, so we need to get translation here
                const allRoles = await ContactRole.getAll(context, {})
                const translatedRolesMap = Object.fromEntries(allRoles.map(role => ([role.id, role.name])))

                const contacts = await loadContactsForExcelExport({ where, sortBy })
                if (contacts.length === 0) {
                    throw new GQLError(errors.NOTHING_TO_EXPORT, context)
                }
                const excelRows = contacts.map(contact => {
                    const unitType = contact.unitName ? i18n(`field.UnitType.${contact.unitType}`, { locale }) : ''
                    const roleId = get(contact, 'role', null)
                    return {
                        name: contact.name,
                        address: contact.property,
                        unitName: contact.unitName,
                        unitType,
                        phone: contact.phone,
                        email: contact.email,
                        role: roleId ? translatedRolesMap[roleId] : '',
                    }
                })
                const linkToFile = await createExportFile({
                    fileName: `contacts_${dayjs().format('DD_MM')}.xlsx`,
                    templatePath: CONTACTS_EXPORT_TEMPLATE_PATH,
                    replaces: {
                        contacts: excelRows,
                        i18n: {
                            ...getHeadersTranslations(EXPORT_TYPE_CONTACTS, locale),
                            sheetName: i18n('menu.Contacts', { locale }),
                        },
                    },
                    meta: {
                        listkey: 'Contact',
                        id: contacts[0].id,
                    },
                })
                return { status: 'ok', linkToFile }
            },
        },
    ],
    mutations: [],
})

module.exports = {
    ExportContactsService,
}
