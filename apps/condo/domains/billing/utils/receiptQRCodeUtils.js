const Big = require('big.js')
const dayjs = require('dayjs')
const { get, isNil, set } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { BillingReceipt, getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')

const REQUIRED_QR_CODE_FIELDS = ['BIC', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc']
const PERIOD_WITHOUT_DOT_REGEXP = /^\d{6}$/ // MMYYYY YYYYMM

/**
 * Default day of month for detection of period. Before this date we use previous month, after - the next one
 * This value is used as fallback for billingContext.settings.receiptUploadDate
 * @type {number}
 */
const DEFAULT_PERIODS_EDGE_DATE = 20

/**
 * @param {TRUQRCodeFields} qrCode
 * @param {string} fieldName
 * @return {string}
 */
function getQRCodeField (qrCode, fieldName) {
    const entries = Object.entries(qrCode)
    const ientries = entries.map(([fieldName, value]) => [fieldName.toLowerCase(), value])
    return get(Object.fromEntries(ientries), fieldName.toLowerCase())
}

/**
 * @param {TRUQRCodeFields} qrCode
 * @param {string[]} fieldsNames
 * @return {Object<string, string>}
 */
function getQRCodeFields (qrCode, fieldsNames) {
    const result = {}

    for (const fieldName of fieldsNames) {
        set(result, fieldName, getQRCodeField(qrCode, fieldName))
    }

    return result
}

/**
 * @param {TRUQRCodeFields} qrCode
 * @return {string[]}
 */
function getQRCodeMissedFields (qrCode) {
    return REQUIRED_QR_CODE_FIELDS.filter((requiredField) => !getQRCodeField(qrCode, requiredField))
}

/**
 * Produce or keep date in format MM.YYYY
 * @param {TRUQRCodeFields} qrCode
 * @param billingContext
 * @return {string}
 */
function getQRCodePaymPeriod (qrCode, billingContext) {
    let paymPeriod = getQRCodeField(qrCode, 'PaymPeriod')

    // NOTE(YEgorLu): for format MMYYYY AND YYYYMM. Since 2024 year it is okay:
    // {12}20{24} | {20}24{12} - so at least on one side we surely can tell that number is not a month
    if (paymPeriod && PERIOD_WITHOUT_DOT_REGEXP.test(paymPeriod)) {
        const currentYear = dayjs().year()
        const firstTwo = parseInt(paymPeriod.substring(0, 2), 10)
        const firstFour = parseInt(paymPeriod.substring(0, 4), 10)
        const lastTwo = parseInt(paymPeriod.substring(4, 6), 10)
        const lastFour = parseInt(paymPeriod.substring(2, 6), 10)

        const firstTwoIsMonth = firstTwo >= 1 && firstTwo <= 12
        const firstFourIsYear = firstFour >= currentYear - 1 && firstFour <= currentYear + 1
        const lastTwoIsMonth = lastTwo >= 1 && lastTwo <= 12
        const lastFourIsYear = lastFour >= currentYear - 1 && lastFour <= currentYear + 1

        // MMYYYY
        if (firstTwoIsMonth && lastFourIsYear) {
            paymPeriod = `${String(firstTwo).padStart(2, '0')}.${lastFour}`
        }
        // YYYYMM
        else if (firstFourIsYear && lastTwoIsMonth) {
            paymPeriod = `${String(lastTwo).padStart(2, '0')}.${firstFour}`
        } else {
            // trigger next "if" check
            paymPeriod = null
        }
    }

    if (!paymPeriod || typeof paymPeriod !== 'string') {
        const periodsEdgeDay = Number(get(billingContext, ['settings', 'receiptUploadDate'])) || DEFAULT_PERIODS_EDGE_DATE
        const currentDay = dayjs().date()
        if (currentDay < periodsEdgeDay) {
            paymPeriod = dayjs().subtract(1, 'month').format('MM.YYYY')
        } else {
            paymPeriod = dayjs().format('MM.YYYY')
        }
    }



    return paymPeriod
}

/**
 * @param context
 * @param {string} accountNumber
 * @param {string} period Formatted period YYYY-MM-01
 * @param {string[]} organizationIds
 * @param {string} recipientBankAccount
 * @return {Promise<boolean>}
 */
async function isReceiptPaid (context, accountNumber, period, organizationIds, recipientBankAccount) {
    // check if receipt already paid
    // at this point no mater if receipt was paid as a virtual one or by billing receipt
    // since all of them must have enough information about payment destination

    // let's request payments that have specific statuses and receipt params
    // and decide if we are going to make a duplicate
    const payments = await find('Payment', {
        accountNumber,
        period,
        organization: { id_in: organizationIds },
        status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
        recipientBankAccount,
        deletedAt: null,
    })

    return payments.length > 0
}

/**
 * @callback TOnNoReceipt
 * @returns {Promise<void>}
 */

/**
 * @callback TOnReceiptPeriodEqualsToQrCodePeriod
 * @param {BillingReceipt} billingReceipt
 * @returns {Promise<void>}
 */

/**
 * @callback TOnReceiptPeriodNewerThanQrCodePeriod
 * @param {BillingReceipt} billingReceipt
 * @returns {Promise<void>}
 */

/**
 * @callback TOnReceiptPeriodOlderThanQrCodePeriod
 * @param {BillingReceipt} billingReceipt
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} TCompareQRResolvers
 * @property {TOnNoReceipt} [onNoReceipt] Call if no receipt found
 * @property {TOnReceiptPeriodEqualsToQrCodePeriod} [onReceiptPeriodEqualsQrCodePeriod] Call if receipt's period is equals to qr-code period
 * @property {TOnReceiptPeriodNewerThanQrCodePeriod} [onReceiptPeriodNewerThanQrCodePeriod] Call if last found receipt is newer than scanned one
 * @property {TOnReceiptPeriodOlderThanQrCodePeriod} [onReceiptPeriodOlderThanQrCodePeriod] Call if last found receipt is older than scanned one
 */

/**
 * @param context
 * @param {TRUQRCodeFields} qrCodeFields
 * @param {TCompareQRResolvers} resolvers
 * @return {Promise<void>}
 */
async function compareQRCodeWithLastReceipt (context, qrCodeFields, resolvers) {
    const period = formatPeriodFromQRCode(getQRCodeField(qrCodeFields, 'PaymPeriod'))

    const [lastBillingReceipt] = await BillingReceipt.getAll(
        context,
        {
            account: { number: getQRCodeField(qrCodeFields, 'PersAcc'), deletedAt: null },
            receiver: {
                tin: getQRCodeField(qrCodeFields, 'PayeeINN'),
                bic: getQRCodeField(qrCodeFields, 'BIC'),
                bankAccount: getQRCodeField(qrCodeFields, 'PersonalAcc'),
                deletedAt: null,
            },
            deletedAt: null,
        },
        'id period toPay category { id name } createdAt',
        { sortBy: ['period_DESC'], first: 1 },
    )

    if (isNil(lastBillingReceipt)) {
        // No receipts found at our side
        resolvers.onNoReceipt && await resolvers.onNoReceipt()
    } else if (lastBillingReceipt.period === period) {
        resolvers.onReceiptPeriodEqualsQrCodePeriod && await resolvers.onReceiptPeriodEqualsQrCodePeriod(lastBillingReceipt)
    } else if (lastBillingReceipt.period > period) {
        // we have a newer receipt at our side
        resolvers.onReceiptPeriodNewerThanQrCodePeriod && await resolvers.onReceiptPeriodNewerThanQrCodePeriod(lastBillingReceipt)
    } else {
        // the last receipt is older than the scanned one
        resolvers.onReceiptPeriodOlderThanQrCodePeriod && await resolvers.onReceiptPeriodOlderThanQrCodePeriod(lastBillingReceipt)
    }
}

/**
 * @param {string} period
 * @return {string}
 */
function formatPeriodFromQRCode (period) {
    const parts = period.split('.')

    return `${parts[1]}-${parts[0]}-01`
}

/**
 * Rules for period:
 * @param lastBillingReceipt - as result ob validateQRCodeService
 * @param receiptsUploadDay {Number} - normally is BillingIntegrationOrganizationContext.settings.receiptsUploadDay
 * @returns {Promise<string>} YYYY-MM-01, or null if lastBillingReceipt was not provided
 */
async function calculatePaymentPeriod (lastBillingReceipt, receiptsUploadDay = 20) {
    if (!lastBillingReceipt) {
        return null
    }

    // Parse receiptUploadDay as Date

    const now = dayjs(dayjs().format('YYYY-MM-DD'))
    /** Last date, when receipts should've benn uploaded into system
     * @type {dayjs.Dayjs} */
    let lastReceiptUploadDate = now.date(receiptsUploadDay)
    // NOTE(YEgorLu): handle overflow if currentDay > receiptUploadDay
    if (lastReceiptUploadDate.month() !== now.month()) {
        lastReceiptUploadDate = lastReceiptUploadDate.date(now.daysInMonth())
    }
    if (now.date() < receiptsUploadDay) {
        // NOTE(YEgorLu): now Feb 11, receiptsUploadDay = 31, prev month has 30 days, need to handle properly
        lastReceiptUploadDate = now.subtract(1, 'month').date(receiptsUploadDay)
        if (lastReceiptUploadDate.month() !== now.subtract(1, 'month').month()) {
            lastReceiptUploadDate = now.subtract(1, 'month')
            lastReceiptUploadDate = lastReceiptUploadDate.date(lastReceiptUploadDate.daysInMonth())
        }
    }

    // Check if new receipt should've been uploaded by now

    const receiptCreatedAt = dayjs(dayjs(lastBillingReceipt.createdAt).format('YYYY-MM-DD'))
    let receiptPeriod = lastBillingReceipt.period
    let receiptNextPeriod = dayjs(lastBillingReceipt.period, 'YYYY-MM-DD').add(1, 'month').format('YYYY-MM-01')
    // NOTE(YEgorLu): by current date new receipt should have been uploaded (lastReceiptUploadDate). If uploaded, then it is last in current period
    let isLastReceiptInCurrentPeriod = receiptCreatedAt.isSame(lastReceiptUploadDate) || receiptCreatedAt.isAfter(lastReceiptUploadDate)

    // Check if receipt is fully paid

    if (isLastReceiptInCurrentPeriod) {
        const paid = await getNewPaymentsSum(lastBillingReceipt.id)
        const didFullyPayForReceipt = Big(lastBillingReceipt.toPay).minus(paid).lte(0)
        if (didFullyPayForReceipt) {
            return receiptNextPeriod
        }
    }
    return receiptPeriod
}

module.exports = {
    DEFAULT_PERIODS_EDGE_DATE,
    getQRCodeField,
    getQRCodeFields,
    getQRCodeMissedFields,
    getQRCodePaymPeriod,
    isReceiptPaid,
    compareQRCodeWithLastReceipt,
    formatPeriodFromQRCode,
    calculatePaymentPeriod,
}
