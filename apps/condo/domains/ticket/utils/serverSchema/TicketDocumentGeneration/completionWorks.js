const dayjs = require('dayjs')
const { get } = require('lodash')

const { getById, getByCondition } = require('@open-condo/keystone/schema')

const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { getAddressDetails } = require('@condo/domains/property/utils/serverSchema/helpers')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')


const DATE_FORMAT = 'DD.MM.YYYY'
const formatDate = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}

const buildExportWordFile = async ({ task, documentData, locale, timeZone }) => {
    const { id, ticket } = task

    const { stream } = await buildExportFile({
        templatePath: `./domains/ticket/templates/ticketDocumentGenerationTemplates/completionWorks/${locale}.docx`,
        replaces: documentData,
    })

    return {
        stream,
        filename: `completion_works_ticket_${ticket.id}_${formatDate(undefined, timeZone, 'DD_MM_YYYY')}.docx`,
        mimetype: DOCX_FILE_META.mimetype,
        encoding: DOCX_FILE_META.encoding,
        meta: {
            listkey: 'TicketDocumentGenerationTask',
            id,
        },
    }
}

const renderMoney = (amount, currencyCode, locale) => {
    const options = { currency: currencyCode }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value).join('')
}

const generateTicketDocumentOfCompletionWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {
    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone).locale(locale)

    const property = await getById('Property', ticket.property)
    const { renderData, streetPart, settlement, cityType, cityName, houseName, block } = getAddressDetails(get(property, 'addressMeta', ticket.propertyAddressMeta))

    const contact = ticket.contact
        ? await getById('Contact', ticket.contact)
        : null

    const employee = organization.id && ticket.executor
        ? await getByCondition('OrganizationEmployee', {
            organization: { id: organization.id },
            user: { id: ticket.executor },
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
