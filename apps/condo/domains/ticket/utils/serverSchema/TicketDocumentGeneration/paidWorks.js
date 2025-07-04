const Big = require('big.js')
const dayjs = require('dayjs')
const localizedFormat = require('dayjs/plugin/localizedFormat')
const { get } = require('lodash')
// TODO(Tolmachev): DOMA-11884 1.16.0+ Moved away from CJS, consider migrating to to-words or other CJS-friendly alternatives
const n2words = require('n2words')
dayjs.extend(localizedFormat)

const { FinanceInfoClient } = require('@open-condo/clients/finance-info-client/FinanceInfoClient')
const { getLogger } = require('@open-condo/keystone/logging')
const { getByCondition } = require('@open-condo/keystone/schema')

const { RU_LOCALE } = require('@condo/domains/common/constants/locale')
const { buildExportFile, DOCX_FILE_META } = require('@condo/domains/common/utils/createExportFile')
const { buildUploadInputFrom } = require('@condo/domains/common/utils/serverSchema/export')
const { normalizeTimeZone } = require('@condo/domains/common/utils/timezone')
const { DEFAULT_INVOICE_CURRENCY_CODE, INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/serverSchema')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
const { TICKET_DOCUMENT_GENERATION_TASK_FORMAT } = require('@condo/domains/ticket/constants/ticketDocument')

const logger = getLogger('generateDocumentOfPaidWorksCompletion')

const LONG_BLANK = '____________________________________'
const SHORT_BLANK = '__________________'
const CURRENCY_CODE_REGEXP = /[A-Z]{3}/

const financeInfoClient = new FinanceInfoClient()

async function getFinanceInfoDataByLocale (organization, { locale }) {
    let organizationAddress = null, iec = null, psrn = null

    if (locale === RU_LOCALE) {
        try {
            ({ iec, psrn, organizationAddress } = await financeInfoClient.getOrganization(organization.tin))
        } catch (error) {
            logger.info({ msg: 'fall financeInfoClient when get organization by tin', organizationId: organization.id, tin: organization.tin, error: error })
        }
    }

    return { iec, psrn, organizationAddress }
}

const replaceAllNullishValues = (object, replace) => {
    for (let key in object) {
        if (typeof object[key] === 'object' && object[key] !== null) {
            replaceAllNullishValues(object[key], replace)
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
        filename: `paid_works_ticket_${ticket.id}_${dayjs().tz(timeZone).format('DD_MM_YYYY')}.docx`,
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

    const contact = get(ticket, 'contact') ? await getByCondition('Contact', {
        id: ticket.contact,
        deletedAt: null,
    }) : null

    const employee = get(organization, 'id') && get(ticket, 'executor')
        ? await getByCondition('OrganizationEmployee', {
            organization: { id: organization.id, deletedAt: null },
            user: { id: ticket.executor, deletedAt: null },
            deletedAt: null,
        }) : null

    const invoices = await Invoice.getAll(context, {
        ticket: { id: ticket.id },
        deletedAt: null,
        status_not: INVOICE_STATUS_CANCELED,
    }, 'id currencyCode accountNumber rows { isMin toPay name count vatPercent } recipient { bankName bankAccount bic offsettingAccount }', {
        sortBy: ['createdAt_ASC'],
    })

    const currencyCode = get(invoices, '0.currencyCode') || DEFAULT_INVOICE_CURRENCY_CODE
    const numberFormatByLocale = Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code',
    })

    let totalSum = Big(0), totalVAT = Big(0)

    const listOfWorks = invoices.reduce((acc, invoice) => {
        const rows = Array.isArray(invoice.rows) ? invoice.rows : []
        acc.push(...rows.map((row, index) => {
            let price = Big(0), count = Big(1), vatPercent = Big(0), sum = Big(0)
            try {
                if (!row.isMin) price = !Number.isNaN(parseFloat(row.toPay)) ? Big(row.toPay) : Big(0)
                count = !Number.isNaN(parseFloat(row.count)) ? Big(row.count) : Big(1)
                vatPercent = !Number.isNaN(parseFloat(row.vatPercent)) ? Big(row.vatPercent) : Big(0)

                sum = price.times(count)

                totalSum = totalSum.plus(sum)
                totalVAT = totalVAT.plus(sum.times(vatPercent).div(100))

                return {
                    number: index + 1,
                    name: row.name,
                    count: String(count),
                    price: !Number.isNaN(parseFloat(price)) ? numberFormatByLocale.format(price).replace(CURRENCY_CODE_REGEXP, '').trim() : null,
                    vat: String(vatPercent),
                    sum: !Number.isNaN(parseFloat(sum)) ? numberFormatByLocale.format(sum).replace(CURRENCY_CODE_REGEXP, '').trim() : null,
                }
            } catch (err) {
                logger.info({
                    msg: 'listOfWorks generation error in document of paid completion works',
                    err: err,
                    taskId: task.id,
                    ticketId: ticket.id,
                })
                return {}
            }
        }))

        return acc
    }, [])

    // NOTE: This doc needs two variables to be generated:
    // 1. Values that will go into the table (documentTextData)
    // 2. Values that will be embeded into the text of the document (documentDataInTable)

    const documentTextData = {
        header: {
            generalDate: dayjs().tz(timeZone).locale(locale).format('L'),
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
            accountNumber: get(invoices, '0.recipient.bankAccount'),
            bankName: get(invoices, '0.recipient.bankName'),
            bankAccount: get(invoices, '0.recipient.offsettingAccount'),
            bic: get(invoices, '0.recipient.bic'),
        },
        totalInWords: {
            totalSumWholePart: n2words(numberFormatByLocale
                .formatToParts(totalSum)
                .map(p => p.type === 'integer' ? p.value : '')
                .join(''), { lang: locale }),
            totalSumDecimalPart: n2words(numberFormatByLocale
                .formatToParts(totalSum)
                .map(p => p.type === 'fraction' ? p.value : '')
                .join(''), { lang: locale, feminine: locale === RU_LOCALE }),
            totalVATWholePart: n2words(numberFormatByLocale
                .formatToParts(totalVAT)
                .map(p => p.type === 'integer' ? p.value : '')
                .join(''), { lang: locale }),
            totalVATDecimalPart: n2words(numberFormatByLocale
                .formatToParts(totalVAT)
                .map(p => p.type === 'fraction' ? p.value : '')
                .join(''), { lang: locale, feminine: locale === RU_LOCALE }),
        },
    }

    const documentDataInTable = {
        client: {
            name: get(contact, 'name', ''),
        },
        listOfWorks,
        totalInNumbers: {
            totalSum: !Number.isNaN(parseFloat(totalSum)) ? numberFormatByLocale.format(totalSum).replace(CURRENCY_CODE_REGEXP, '').trim() : null,
            totalVAT: !Number.isNaN(parseFloat(totalVAT)) ? numberFormatByLocale.format(totalVAT).replace(CURRENCY_CODE_REGEXP, '').trim() : null,
        },
        executor: {
            name: get(employee, 'name', ''),
        },
    }

    const documentData = {
        ...replaceAllNullishValues(documentTextData, (key, value) => value ? value : (key === 'address' || key === 'name') ? LONG_BLANK : SHORT_BLANK),
        ...replaceAllNullishValues(documentDataInTable, (key, value) => value ? value : ''),
    }

    let fileUploadInput

    switch (format) {
        case TICKET_DOCUMENT_GENERATION_TASK_FORMAT.DOCX: {
            fileUploadInput = buildUploadInputFrom(await buildExportWordFile({
                task,
                documentData,
                locale,
                timeZone,
            }))
            break
        }

        default: {
            throw new Error(`unexpected format "${format}" for a document generation`)
        }
    }

    logger.info({
        msg: 'finished genereating a document of paid completion works ',
        taskId: task.id,
        ticketId: ticket.id,
    })

    return fileUploadInput
}

module.exports = {
    generateTicketDocumentOfPaidWorks,
}