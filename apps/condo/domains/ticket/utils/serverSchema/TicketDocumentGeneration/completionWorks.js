const dayjs = require('dayjs')
const { get } = require('lodash')

const { getByCondition } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { renderMoney } = require('@condo/domains/common/utils/money')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { getAddressDetails } = require('@condo/domains/property/utils/serverSchema/helpers')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')

const buildExportWordFile = async ({ task, documentData, locale, timeZone }) => {
    const { id, ticket } = task

    const { stream } = await buildExportFile({
        templatePath: `./domains/ticket/templates/ticketDocumentGenerationTemplates/completionWorks/${locale}.docx`,
        replaces: documentData,
    })

    return {
        stream,
        filename: `completion_works_ticket_${ticket.id}_${dayjs().tz(timeZone).format('DD_MM_YYYY')}.docx`,
        mimetype: DOCX_FILE_META.mimetype,
        encoding: DOCX_FILE_META.encoding,
        meta: {
            listkey: 'TicketDocumentGenerationTask',
            id,
        },
    }
}

const generateTicketDocumentOfCompletionWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {
    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone).locale(locale)

    const property = await getByCondition('Property', {
        id: ticket.property,
        deletedAt: null,
    })

    const { renderData, streetPart, settlement, cityType, cityName, houseName, block } = getAddressDetails(get(property, 'addressMeta', ticket.propertyAddressMeta))

    const contact = ticket.contact
        ? await getByCondition('Contact', {
            id: ticket.contact,
            deletedAt: null,
        })
        : null

    const employee = organization.id && ticket.executor
        ? await getByCondition('OrganizationEmployee', {
            organization: { id: organization.id, deletedAt: null },
            user: { id: ticket.executor, deletedAt: null },
            deletedAt: null,
        })
        : null

    const invoices = await Invoice.getAll(context, {
        ticket: { id: ticket.id },
        deletedAt: null,
        status_not: INVOICE_STATUS_CANCELED,
    }, 'id currencyCode rows { isMin toPay name count }', {
        sortBy: ['createdAt_ASC'],
    })

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map(row => {
            const price = parseFloat(!row.isMin ? row.toPay : null)

            return {
                name: row.name || '',
                count: String(row.count) || '',
                price: !Number.isNaN(price) ? renderMoney(price, currencyCode, locale) : '',
                sum: !Number.isNaN(price) ? renderMoney(price * row.count, currencyCode, locale) : '',
            }
        }))

        return acc
    }, [])

    const unitType = get(ticket, 'unitType') || 'flat'

    const documentData = {
        city: {
            name: cityName || '',
            type: cityType || '',
        },
        printDate: {
            day: printDate.format('DD'),
            month: printDate.format('MMMM'),
            year: printDate.format('YYYY'),
        },
        property: {
            fullAddress: [renderData, streetPart].filter(Boolean).join(' '),
            address: [renderData, settlement].filter(Boolean).join(' '),
            number: [houseName, block].filter(Boolean).join(''),
        },
        client: {
            name: get(contact, 'name') || '',
        },
        unit: {
            name: get(ticket, 'unitName') || '',
            type: (unitType ? i18n(`field.UnitType.act.${unitType}`, { locale }) : '').toLowerCase(),
        },
        company: {
            name: get(organization, 'name') || '',
        },
        executor: {
            name: get(employee, 'name') || '',
            position: get(employee, 'position') || '',
        },
        listOfWorks,
    }

    let fileUploadInput

    switch (format) {
        case TICKET_DOCUMENT_GENERATION_TASK_FORMAT.DOCX: {
            fileUploadInput = buildUploadInputFrom(await buildExportWordFile({ task, documentData, locale, timeZone }))
            break
        }

        default: {
            throw new Error(`unexpected format "${format}" for a document generation`)
        }
    }

    return fileUploadInput
}


module.exports = {
    generateTicketDocumentOfCompletionWorks,
}
