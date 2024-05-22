const { get, isNil } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')

const REQUIRED_QR_CODE_FIELDS = ['BIC', 'PayerAddress', 'PaymPeriod', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc']

/**
 * @typedef {Object} TQRCodeFields
 * @property {string} BIC
 * @property {string} PayerAddress
 * @property {string} PaymPeriod
 * @property {string} Sum
 * @property {string} PersAcc The resident's account
 * @property {string} PayeeINN
 * @property {string} PersonalAcc The bank account of the receiver
 */

/**
 * @param {string} qrStr The QR code string got from the picture
 * @return {TQRCodeFields}
 */
function parseReceiptQRCode (qrStr) {
    const matches = /^ST(?<version>\d{4})(?<encodingTag>\d)\|(?<requisitesStr>.*)$/g.exec(qrStr)

    if (!matches) {
        throw new Error('Invalid QR code')
    }

    const requisitesStr = get(matches, ['groups', 'requisitesStr'], '')

    // TODO(AleX83Xpert): maybe decode requisitesStr
    // Need to test the result of scanning from mobile devices
    // https://encoding.spec.whatwg.org/#koi8-r
    // https://encoding.spec.whatwg.org/#windows-1251
    // const encodingTag = get(matches, ['groups', 'encodingTag'])
    // const encoding = get(['windows-1251', 'utf-8', 'koi8-r'], encodingTag, 'utf-8')

    return Object.fromEntries(requisitesStr.split('|').map((part) => part.split('=', 2)))
}

/**
 * @param {TQRCodeFields} qrCode
 * @return {string[]}
 */
function getQRCodeMissedFields (qrCode) {
    return REQUIRED_QR_CODE_FIELDS.filter((requiredField) => !get(qrCode, requiredField, null))
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
 * @param {TQRCodeFields} qrCodeFields
 * @param {TCompareQRResolvers} resolvers
 * @return {Promise<void>}
 */
async function compareQRCodeWithLastReceipt (qrCodeFields, resolvers) {
    const period = formatPeriodFromQRCode(qrCodeFields.PaymPeriod)

    const [lastBillingReceipt] = await find('BillingReceipt', {
        account: { number: qrCodeFields.PersAcc, deletedAt: null },
        receiver: { bankAccount: qrCodeFields.PersonalAcc, deletedAt: null },
        deletedAt: null,
    }, {
        sortBy: ['period_DESC'],
        first: 1,
    })

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
    parseReceiptQRCode,
    getQRCodeMissedFields,
    isReceiptPaid,
    compareQRCodeWithLastReceipt,
    formatPeriodFromQRCode,
}
