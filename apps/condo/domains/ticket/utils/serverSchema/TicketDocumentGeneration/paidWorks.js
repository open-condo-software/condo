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
        templatePath: `./domains/ticket/templates/ticketDocumentGenerationTemplates/paidWorks/${locale}.docx`,
        replaces: documentData,
    })

    return {
        stream,
        filename: `paid_works_ticket_${ticket.id}_${formatDate(undefined, timeZone, 'DD_MM_YYYY')}.docx`,
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


const generateTicketDocumentOfPaidWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {
    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone).locale(locale)

    const property = await getById('Property', ticket.property)
    const { renderData, streetPart, settlement } = getAddressDetails(get(property, 'addressMeta', ticket.propertyAddressMeta))

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
    }, {
        sortBy: ['createdAt_ASC'],
    })
    console.log('This is invoices 1', invoices)

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE
    let totalPrice, totalVAT

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map((row, index) => {
            const primePrice = parseFloat(!row.isMin ? row.toPay : null)
            const price = renderMoney(primePrice, currencyCode, locale)
            totalPrice += price
            const sum = renderMoney(price * row.count, currencyCode, locale)
            const vat =  renderMoney(sum * (row.vatPercent / 100), currencyCode, locale)
            totalVAT += vat

            const total = sum + vat

            return {
                name: row.name || '',
                index: index + 1 || '', 
                count: String(row.count) || '',
                price: !Number.isNaN(price) ? price : '',
                sum: !Number.isNaN(price) ? sum : '',
                vat:  !Number.isNaN(price) ? vat : '',
                total: !Number.isNaN(price) ? total : '',
            }
        }))

        return acc
    }, [])

    const totalPriceWithVAT = `${totalPrice + totalVAT}`

    const documentData = {
        print: {
            generalDate: printDate.format('DD.MM.YYYY'),
            numberTicket: ticket.number || '',
        },
        property: {
            fullAddress: [renderData, streetPart].filter(Boolean).join(' '),
            address: [renderData, settlement].filter(Boolean).join(' '),
        },
        client: {
            name: get(contact, 'name') || '',
        },
        company: {
            name: get(organization, 'name') || '',
        },
        executor: {
            name: get(employee, 'name') || '',
            position: get(employee, 'position') || '',
            phone: get(employee, 'phone') || '',
        },
        recipientRequisites: {
            accountNumber: get(invoices, '0.accountNumber') || '',
            bankAccount: get(invoices, '0.recipient.bankAccount') || '',
            bic: get(invoices, '0.recipient.bic') || '',
            tin: get(invoices, '0.recipient.tin') || '',
            iec: get(invoices, '0.recipient.iec') || '',
            bankName: get(invoices, '0.recipient.bankName') || '',
        },
        listOfWorks,
        sum: {
            totalPrice: totalPrice,
            totalVAT: totalVAT,
            totalPriceWithVAT: totalPriceWithVAT,
        },
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
    generateTicketDocumentOfPaidWorks,
}