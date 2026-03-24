/**
 * Domain constants for RegisterMultiPaymentService
 * Extracted from RegisterMultiPaymentService.js for better maintainability
 */

/**
 * Request mode enumeration
 * Defines whether the payment request is for receipts or invoices
 */
const REQUEST_MODE = {
    RECEIPTS: 'RECEIPTS',
    INVOICES: 'INVOICES',
}

/**
 * Total amount fields that are calculated and stored in MultiPayment
 */
const TOTAL_FIELDS = [
    'amountWithoutExplicitFee',
    'explicitFee',
    'explicitServiceCharge',
    'serviceFee',
    'implicitFee',
]

module.exports = {
    REQUEST_MODE,
    TOTAL_FIELDS,
}
