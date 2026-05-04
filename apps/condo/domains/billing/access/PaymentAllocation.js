const { canManageLedgerEntries, canReadLedgerEntries } = require('./LedgerEntry')

module.exports = {
    canManagePaymentAllocations: canManageLedgerEntries,
    canReadPaymentAllocations: canReadLedgerEntries,
}