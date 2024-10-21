const { formatRubles } = require('@vicimpa/rubles')
const dayjs = require('dayjs')
const { get } = require('lodash')

const { FinanceInfoClient } = require('@open-condo/clients/finance-info-client/FinanceInfoClient')
const { getById, getByCondition } = require('@open-condo/keystone/schema')

const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')

const BLANK = '_______________________'

const DATE_FORMAT = 'DD.MM.YYYY'
const formatDate = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}

const renderMoney = (amount, currencyCode, locale) => {
    const options = { currency: currencyCode }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value).join('')
}

const financeInfoClient = new FinanceInfoClient()

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

const generateTicketDocumentOfPaidWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {
    let psrn = null, organizationAddress = null, iec = null
    try {
        ({ iec, psrn, organizationAddress } = await financeInfoClient.getOrganization(organization.tin))
    } catch (error) {
        console.error(error)
    }
    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone).locale(locale)


    console.log('contact', ticket.contact)
    const contact = ticket.contact ? await getById('Contact', ticket.contact) : null

    console.log('executor', ticket.executor)
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

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE
    let totalSum = 0, totalVAT = 0, vatPercent = get(invoices, '0.rows.0.vatPercent')

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map((row, index) => {
            const price = parseFloat(!row.isMin ? row.toPay : null)
            const sum = price * row.count
            totalSum += sum

            return {
                number: index + 1 || '',
                name: row.name || '',
                count: String(row.count) || '',
                price: !Number.isNaN(price) ? renderMoney(price, currencyCode, locale) : '',
                vat: vatPercent || '',
                sum: !Number.isNaN(sum) ? renderMoney(sum, currencyCode, locale) : '',
            }
        }))

        return acc
    }, [])

    totalVAT = totalSum * vatPercent / 100
    totalVAT.toFixed(2)

    const documentData = {
        header: {
            generalDate: printDate.format('DD.MM.YYYY'),
        },
        company: {
            name: get(organization, 'name') || BLANK,
            psrn: psrn || BLANK,
            tin: get(organization, 'tin') || BLANK, 
            iec: iec || BLANK,
            address: organizationAddress || BLANK,
            phone: get(organization, 'phone') || BLANK, 

        },
        bankDetails: {
            accountNumber: get(invoices, '0.accountNumber') || BLANK,
            bankName: get(invoices, '0.recipient.bankName') || BLANK,
            bankAccount: get(invoices, '0.recipient.bankAccount') || BLANK,
            bic: get(invoices, '0.recipient.bic') || BLANK,
        },
        client: {
            name: get(contact, 'name') || BLANK,
        },
        listOfWorks,
        sum: {
            totalSum: !Number.isNaN(totalSum) ? renderMoney(totalSum, currencyCode, locale) : BLANK,
            totalVAT: !Number.isNaN(totalVAT) ? renderMoney(totalVAT, currencyCode, locale) : BLANK,
            totalSumInWords: !Number.isNaN(totalVAT) ? formatRubles(totalSum) : BLANK,
            totalVATInWords: !Number.isNaN(totalVAT) ?  formatRubles(totalVAT) : BLANK,
        },
        executor: {
            name: get(employee, 'name') || '',
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