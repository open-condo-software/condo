const Big = require('big.js')
const dayjs = require('dayjs')
const { get } = require('lodash')

const { FinanceInfoClient } = require('@open-condo/clients/finance-info-client/FinanceInfoClient')
const { getLogger } = require('@open-condo/keystone/logging')
const { getByCondition } = require('@open-condo/keystone/schema')

const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { renderMoney } = require('@condo/domains/common/utils/money')
const { ToWords } = require('@condo/domains/common/utils/numberToWords')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')
const { formatDateToTimezone } = require('@condo/domains/ticket/utils')

const logger = getLogger('generateDocumentOfPaidWorksCompletion')

const numberToWords = new ToWords()
const financeInfoClient = new FinanceInfoClient()

async function getLocaleToPullFinanceInfoClient (locale, organization) {
    let psrn = null, organizationAddress = null, iec = null

    if (locale === 'ru') {
        try {
            ({ iec, psrn, organizationAddress } = await financeInfoClient.getOrganization(organization.tin))
        } catch (error) {
            logger.info({ msg: 'fall financeInfoClient when get organization by tin', organizationId: organization.id, tin: organization.tin, error: error })
        }
    }

    return { iec, psrn, organizationAddress }
}

const changeUndefinedDataToBlanks = (documentDataInLine) => {
    const metaInfoAboutLongWords = {
        name: true,
        address: true,
    }
    const chengedDocumentDataInLine = Object.fromEntries(Object.entries(documentDataInLine).map(([key, value]) => {
        let changedValue = {}
        for (let subValue in value) {
            changedValue[subValue] = value[subValue] ? value[subValue] : metaInfoAboutLongWords.hasOwnProperty(subValue) ? '____________________________________' : '__________________'
        }
        return [key, changedValue]
    }))
    
    return chengedDocumentDataInLine
}

const buildExportWordFile = async ({ task, documentData, locale, timeZone }) => {
    const { id, ticket } = task

    const { stream } = await buildExportFile({
        templatePath: `./domains/ticket/templates/ticketDocumentGenerationTemplates/paidWorks/${locale}.docx`,
        replaces: documentData,
    })

    return {
        stream,
        filename: `paid_works_ticket_${ticket.id}_${formatDateToTimezone(undefined, timeZone, 'DD_MM_YYYY')}.docx`,
        mimetype: DOCX_FILE_META.mimetype,
        encoding: DOCX_FILE_META.encoding,
        meta: {
            listkey: 'TicketDocumentGenerationTask',
            id,
        },
    }
}

const generateTicketDocumentOfPaidWorks = async ({ task, baseAttrs, context, locale, ticket, organization }) => {

    const { iec, psrn, organizationAddress } = await getLocaleToPullFinanceInfoClient(locale, organization)

    const { format, timeZone: timeZoneFromUser } = task

    const timeZone = normalizeTimeZone(timeZoneFromUser) || DEFAULT_ORGANIZATION_TIMEZONE
    const printDate = dayjs().tz(timeZone).locale(locale)

    const contact = ticket.contact ? await getByCondition('Contact', {
        id: ticket.contact,
        deletedAt: null,
    }) : null

    const employee = organization.id && ticket.executor
        ? await getByCondition('OrganizationEmployee', {
            organization: { id: organization.id },
            user: { id: ticket.executor },
            deletedAt: null,
        })
        : null

    const invoices = await Invoice.getAll(context, {
        ticket: { id: ticket.id },
        deletedAt: null,
        status_not: INVOICE_STATUS_CANCELED,
    }, 'id currencyCode accountNumber rows { isMin toPay name count vatPercent } recipient { bankName bankAccount bic }', {
        sortBy: ['createdAt_ASC'],
    })

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE
    let totalSum = Big(0), totalVAT = Big(0)

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map((row, index) => {
            const price = Big(!row.isMin ? row.toPay : 0)
            const sum = price.times(get(row, 'count', 1))
            const vatPercent = Big(get(row, 'vatPercent', 0))
            totalSum = totalSum.plus(sum)
            totalVAT = totalVAT.plus(sum.times(vatPercent).div(100))

            return {
                number: index + 1,
                name: row.name || '',
                count: row.count || '',
                price: !Number.isNaN(price) ? renderMoney(price, currencyCode, locale) : '',
                vat: !Number.isNaN(vatPercent) ? vatPercent : '',
                sum: !Number.isNaN(sum) ? renderMoney(sum, currencyCode, locale) : '',
            }
        }))

        return acc
    }, [])

    // NOTE: There are two different types of data in the document template
    // The first is data inserted into tables
    // The second is data inserted directly into the document paragraph

    const documentDataInLine = {
        header: {
            generalDate: printDate.format('DD.MM.YYYY'),
        },
        company: {
            name: get(organization, 'name'),
            psrn: psrn,
            tin: get(organization, 'tin'),
            iec: iec,
            address: organizationAddress,
            phone: get(organization, 'phone'),
        },
        bankDetails: {
            accountNumber: get(invoices, '0.accountNumber'),
            bankName: get(invoices, '0.recipient.bankName'),
            bankAccount: get(invoices, '0.recipient.bankAccount'),
            bic: get(invoices, '0.recipient.bic'),
        },
        totalInWords: {
            totalSum: numberToWords.format(totalSum, locale),
            totalVAT: numberToWords.format(totalVAT, locale),
        },
    }

    const documentDataInTable = {
        client: {
            name: get(contact, 'name') || '',
        },
        listOfWorks,
        totalInNumbers: {
            totalSum: !Number.isNaN(totalSum) ? renderMoney(totalSum, currencyCode, locale) : '',
            totalVAT: !Number.isNaN(totalVAT) ? renderMoney(totalVAT, currencyCode, locale) : '',
        },
        executor: {
            name: get(employee, 'name') || '',
        },
    }

    const documentData = {
        ...changeUndefinedDataToBlanks(documentDataInLine),
        ...documentDataInTable,
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

    logger.info({ msg: 'finish genereate document of paid completion works ', taskId: task.id, ticketId: ticket.id })

    return fileUploadInput
}

module.exports = {
    generateTicketDocumentOfPaidWorks,
}