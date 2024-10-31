const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isPlainObject } = require('lodash')

const { FinanceInfoClient } = require('@open-condo/clients/finance-info-client/FinanceInfoClient')
const { getLogger } = require('@open-condo/keystone/logging')
const { getByCondition } = require('@open-condo/keystone/schema')

const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { renderMoney } = require('@condo/domains/common/utils/money')
const { moneyToWords } = require('@condo/domains/common/utils/moneyToWords')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')
const { formatDateToTimezone } = require('@condo/domains/ticket/utils')

const logger = getLogger('generateDocumentOfPaidWorksCompletion')

const LONG_BLANK = '____________________________________'
const SHORT_BLANK = '__________________'

const financeInfoClient = new FinanceInfoClient()

async function getFinanceInfoDataByLocale (organization, { locale }) {
    let organizationAddress = null, iec = null, psrn = null
    
    if (locale === 'ru') {
        try {
            ({ iec, psrn, organizationAddress } = await financeInfoClient.getOrganization(organization.tin))
        } catch (error) {
            logger.info({ msg: 'fall financeInfoClient when get organization by tin', organizationId: organization.id, tin: organization.tin, error: error })
        }
    }

    return { iec, psrn, organizationAddress }
}

const getDataFormatByLocale = ( locale ) => {
    if (locale === 'ru') 'DD.MM.YYYY'
    return 'YYYY-MM-DD'
}

const _changeToEmptyCell = (key, value) => {
    if (value) {
        return ''
    }
    return value
}

const _changeToBlanks = (key, value) => {
    if (value) {
        return (key === 'address' || key === 'name') ? LONG_BLANK : SHORT_BLANK
    }
    return value
}

const replaceAllUndefinedValues = (object, replace) => {
    for (let key in object) {
        if (isPlainObject(object[key])) {
            replaceAllUndefinedValues(object[key], replace)
        } else (
            object[key] = replace(key, object[key])
        )
    }
    return object
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
    const { iec, psrn, organizationAddress } = await getFinanceInfoDataByLocale(organization, { locale })

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

    // Переписать на find 
    const invoices = await Invoice.getAll(context, {
        ticket: { id: ticket.id },
        deletedAt: null,
        status_not: INVOICE_STATUS_CANCELED,
    }, 'id currencyCode accountNumber rows { isMin toPay name count vatPercent } recipient { bankName bankAccount bic }', {
        sortBy: ['createdAt_ASC'],
    })

    // Спросить у Матвея, как работать с этим? Нет тестов

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE
    let totalSum = Big(0), totalVAT = Big(0)

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map((row, index) => {
            const isExactPrice = !row.isMin ? row.toPay : 0
            const price = !Number.isNaN(isExactPrice) ? Big(isExactPrice) : 0
            const sum = !Number.isNaN(row.count) ? price.times(get(row, 'count', 1)) : 1
            const vatPercent = !Number.isNaN(row.vatPercent) ? Big(get(row, 'vatPercent', 0)) : 0
            totalSum = totalSum.plus(sum) 
            totalVAT = totalVAT.plus(sum.times(vatPercent).div(100))

            return _changeToEmptyCell({
                number: index + 1,
                name: row.name,
                count: row.count,
                price: renderMoney(price, currencyCode, locale),
                vat: vatPercent,
                sum: renderMoney(sum, currencyCode, locale),
            })
        }))
        totalSum = !Number.isNaN(totalSum) ? totalSum : 0
        totalVAT = !Number.isNaN(totalVAT) ? totalVAT : 0

        return acc
    }, [])
    
    // NOTE: This doc needs two variables to be generated:
    // 1. Values that will go into the table (documentTextData)
    // 2. Values that will be embeded into the text of the document (documentDataInTable)

    const documentTextData = {
        header: {
            generalDate: printDate.format(getDataFormatByLocale(locale)),
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
            totalSum: moneyToWords(totalSum.toFixed(2), { locale, currencyCode }),
            totalVAT: moneyToWords(totalVAT.toFixed(2), { locale, currencyCode }),
        },
    }

    const documentDataInTable = {
        client: {
            name: get(contact, 'name'),
        },
        listOfWorks,
        totalInNumbers: {
            totalSum: renderMoney(totalSum, currencyCode, locale),
            totalVAT: renderMoney(totalVAT, currencyCode, locale),
        },
        executor: {
            name: get(employee, 'name'),
        },
    }

    const documentData = {
        ...replaceAllUndefinedValues(documentTextData, _changeToBlanks),
        ...replaceAllUndefinedValues(documentDataInTable, _changeToEmptyCell),
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

    logger.info({ msg: 'finished genereating a document of paid completion works ', taskId: task.id, ticketId: ticket.id })

    return fileUploadInput
}

module.exports = {
    generateTicketDocumentOfPaidWorks,
}