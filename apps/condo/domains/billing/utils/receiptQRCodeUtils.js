const dayjs = require('dayjs')
const { get, isNil, set } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { BillingReceipt } = require('@condo/domains/billing/utils/serverSchema')

const REQUIRED_QR_CODE_FIELDS = ['BIC', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc']

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
 * @param {TRUQRCodeFields} qrCode
 * @param billingContext
 * @return {string}
 */
function getQRCodePaymPeriod (qrCode, billingContext) {
    let ret = getQRCodeField(qrCode, 'PaymPeriod')

    if (!ret) {
        const periodsEdgeDay = Number(get(billingContext, ['settings', 'receiptUploadDate'])) || DEFAULT_PERIODS_EDGE_DATE
        const currentDay = dayjs().date()
        if (currentDay < periodsEdgeDay) {
            ret = dayjs().subtract(1, 'month').format('MM.YYYY')
        } else {
            ret = dayjs().format('MM.YYYY')
        }
    }

    return ret
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
            receiver: { bankAccount: getQRCodeField(qrCodeFields, 'PersonalAcc'), deletedAt: null },
            deletedAt: null,
        },
        'id period toPay',
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

module.exports = {
    DEFAULT_PERIODS_EDGE_DATE,
    getQRCodeField,
    getQRCodeFields,
    getQRCodeMissedFields,
    getQRCodePaymPeriod,
    isReceiptPaid,
    compareQRCodeWithLastReceipt,
    formatPeriodFromQRCode,
}
