const { canManageLedgerEntries, canReadLedgerEntries } = require('./LedgerEntry')

module.exports = {
    canManagePaymentReceipts: canManageLedgerEntries,
    canReadPaymentReceipts: canReadLedgerEntries,
}