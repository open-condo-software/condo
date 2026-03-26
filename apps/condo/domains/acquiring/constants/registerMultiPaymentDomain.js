const REQUEST_MODE = {
    RECEIPTS: 'RECEIPTS',
    INVOICES: 'INVOICES',
}

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
