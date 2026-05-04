const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/LedgerEntry')
const {
    LEDGER_ENTRY_DIRECTION_DEBIT,
    LEDGER_ENTRY_DIRECTIONS,
    LEDGER_ENTRY_STATUS_POSTED,
    LEDGER_ENTRY_STATUSES,
    LEDGER_ENTRY_TYPE_REVERSAL,
    LEDGER_ENTRY_TYPES,
} = require('@condo/domains/billing/constants/ledger')
const { DEFAULT_RENT_CHARGE_CURRENCY_CODE } = require('@condo/domains/billing/constants/rent')
const { CURRENCY_CODE_FIELD, MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const IMMUTABLE_FIELDS = [
    'ledger', 'organization', 'tenant', 'occupancy', 'property', 'rentalUnit', 'rentCharge', 'payment',
    'paymentAllocation', 'receipt', 'entryType', 'direction', 'amount', 'currencyCode',
    'postedAt', 'postingStatus', 'reversesEntry', 'description',
]

const ERRORS = {
    POSTED_ENTRY_IMMUTABLE: {
        code: BAD_USER_INPUT,
        type: 'LEDGER_ENTRY_POSTED_IMMUTABLE',
        message: 'Posted ledger entries are immutable. Create a reversal entry instead.',
        messageForUser: 'api.billing.ledgerEntry.POSTED_ENTRY_IMMUTABLE',
    },
    REVERSAL_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'LEDGER_ENTRY_REVERSAL_REQUIRED',
        message: 'A reversal ledger entry must reference the entry it reverses',
        messageForUser: 'api.billing.ledgerEntry.REVERSAL_REQUIRED',
    },
}

const LedgerEntry = new GQLListSchema('LedgerEntry', {
    schemaDoc: 'Immutable posted tenant ledger entry',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,
        ledger: {
            schemaDoc: 'Tenant ledger this entry belongs to',
            type: 'Relationship',
            ref: 'TenantLedger.entries',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        tenant: {
            schemaDoc: 'Tenant this entry belongs to',
            type: 'Relationship',
            ref: 'Resident',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        occupancy: {
            schemaDoc: 'Occupancy this ledger entry relates to',
            type: 'Relationship',
            ref: 'Occupancy',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        property: {
            schemaDoc: 'Property this ledger entry relates to',
            type: 'Relationship',
            ref: 'Property',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        rentalUnit: {
            schemaDoc: 'Rental unit this ledger entry relates to',
            type: 'Relationship',
            ref: 'RentalUnit',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        rentCharge: {
            schemaDoc: 'Rent charge posted by this ledger entry',
            type: 'Relationship',
            ref: 'RentCharge.ledgerEntries',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        payment: {
            schemaDoc: 'Payment posted by this ledger entry',
            type: 'Relationship',
            ref: 'Payment.ledgerEntries',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        entryType: {
            schemaDoc: 'Ledger entry business type',
            type: 'Select',
            options: LEDGER_ENTRY_TYPES,
            dataType: 'string',
            isRequired: true,
        },
        direction: {
            schemaDoc: 'Debit increases rent owed; credit reduces rent owed or creates tenant credit',
            type: 'Select',
            options: LEDGER_ENTRY_DIRECTIONS,
            dataType: 'string',
            isRequired: true,
            defaultValue: LEDGER_ENTRY_DIRECTION_DEBIT,
            kmigratorOptions: { null: false, default: `'${LEDGER_ENTRY_DIRECTION_DEBIT}'` },
        },
        amount: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Posted entry amount',
            isRequired: true,
        },
        currencyCode: {
            ...CURRENCY_CODE_FIELD,
            schemaDoc: 'Entry currency code',
            defaultValue: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
            kmigratorOptions: { null: false, default: `'${DEFAULT_RENT_CHARGE_CURRENCY_CODE}'` },
        },
        postedAt: {
            schemaDoc: 'Timestamp when this entry was posted',
            type: 'DateTimeUtc',
            isRequired: true,
        },
        postingStatus: {
            schemaDoc: 'Posting status',
            type: 'Select',
            options: LEDGER_ENTRY_STATUSES,
            dataType: 'string',
            isRequired: true,
            defaultValue: LEDGER_ENTRY_STATUS_POSTED,
            kmigratorOptions: { null: false, default: `'${LEDGER_ENTRY_STATUS_POSTED}'` },
        },
        reversesEntry: {
            schemaDoc: 'Original ledger entry reversed by this entry',
            type: 'Relationship',
            ref: 'LedgerEntry',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.PROTECT' },
        },
        receipt: {
            schemaDoc: 'Payment receipt related to this ledger entry',
            type: 'Relationship',
            ref: 'PaymentReceipt.ledgerEntries',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        description: {
            schemaDoc: 'Human-readable posting description',
            type: 'Text',
            isRequired: false,
        },
    },
    hooks: {
        resolveInput: async ({ resolvedData, existingItem, operation }) => {
            if (operation === 'create' && !resolvedData.postedAt) {
                resolvedData.postedAt = new Date().toISOString()
            }

            const ledgerId = get(resolvedData, 'ledger') || get(existingItem, 'ledger')
            if (ledgerId) {
                const ledger = await getById('TenantLedger', ledgerId)
                if (ledger) {
                    resolvedData.organization = ledger.organization
                    resolvedData.tenant = ledger.tenant
                    resolvedData.currencyCode = resolvedData.currencyCode || ledger.currencyCode
                }
            }

            return resolvedData
        },
        validateInput: async ({ resolvedData, existingItem, operation, context }) => {
            if (operation === 'update' && get(existingItem, 'postingStatus') === LEDGER_ENTRY_STATUS_POSTED) {
                const hasImmutableChanges = IMMUTABLE_FIELDS.some(field => Object.prototype.hasOwnProperty.call(resolvedData, field))
                if (hasImmutableChanges) {
                    throw new GQLError(ERRORS.POSTED_ENTRY_IMMUTABLE, context)
                }
            }

            if (operation === 'create' && get(resolvedData, 'entryType') === LEDGER_ENTRY_TYPE_REVERSAL && !get(resolvedData, 'reversesEntry')) {
                throw new GQLError(ERRORS.REVERSAL_REQUIRED, context)
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadLedgerEntries,
        create: access.canManageLedgerEntries,
        update: access.canManageLedgerEntries,
        delete: false,
        auth: true,
    },
})

module.exports = {
    LedgerEntry,
}