const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')
const { i18n } = require('@open-condo/locales/loader')

const { NOTHING_TO_EXPORT } = require('@condo/domains/common/constants/errors')
const { createExportFile } = require('@condo/domains/common/utils/createExportFile')
const { getHeadersTranslations, EXPORT_TYPE_CONTACTS } = require('@condo/domains/common/utils/exportToExcel')
const access = require('@condo/domains/contact/access/ExportContactsService')
const { loadContactsForExcelExport } = require('@condo/domains/contact/utils/serverSchema')
const { ContactRole } = require('@condo/domains/contact/utils/serverSchema')

dayjs.extend(utc)
dayjs.extend(timezone)

const CONTACTS_EXPORT_TEMPLATE_PATH = './domains/contact/templates/ContactsExportTemplate.xlsx'

const ERRORS = {
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
            resolver: async (parent, args, context) => {
                const { where, sortBy } = args.data
                const locale = extractReqLocale(context.req) || conf.DEFAULT_LOCALE

                // role name has LocalizedText type, so we need to get translation here
                const allRoles = await ContactRole.getAll(context, {
                    deletedAt: null,
                    OR: [
                        { organization_is_null: true }, // common roles
                        { organization: { id: where.organization.id } }, // organization's roles
                    ],
                })
                const translatedRolesMap = Object.fromEntries(allRoles.map(role => ([role.id, role.name])))

                const contacts = await loadContactsForExcelExport({ where, sortBy })
                if (contacts.length === 0) {
                    throw new GQLError(ERRORS.NOTHING_TO_EXPORT, context)
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
                const { url: linkToFile } = await createExportFile({
                    fileName: `contacts_${dayjs().format('DD_MM')}.xlsx`,
                    templatePath: CONTACTS_EXPORT_TEMPLATE_PATH,
                    replaces: {
                        contacts: excelRows,
                        i18n: {
                            ...getHeadersTranslations(EXPORT_TYPE_CONTACTS, locale),
                            sheetName: i18n('global.section.contacts', { locale }),
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
