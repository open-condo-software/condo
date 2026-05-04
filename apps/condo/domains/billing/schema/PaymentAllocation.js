const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/PaymentAllocation')
const { DEFAULT_RENT_CHARGE_CURRENCY_CODE } = require('@condo/domains/billing/constants/rent')
const { CURRENCY_CODE_FIELD, MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const PaymentAllocation = new GQLListSchema('PaymentAllocation', {
    schemaDoc: 'Allocation of a confirmed rent payment to a rent charge',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,
        payment: {
            schemaDoc: 'Payment being allocated',
            type: 'Relationship',
            ref: 'Payment.allocations',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        rentCharge: {
            schemaDoc: 'Rent charge settled by this allocation',
            type: 'Relationship',
            ref: 'RentCharge.allocations',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        ledger: {
            schemaDoc: 'Tenant ledger this allocation belongs to',
            type: 'Relationship',
            ref: 'TenantLedger',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        ledgerEntry: {
            schemaDoc: 'Payment ledger entry providing credit for this allocation',
            type: 'Relationship',
            ref: 'LedgerEntry',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
        amount: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Allocated amount',
            isRequired: true,
        },
        currencyCode: {
            ...CURRENCY_CODE_FIELD,
            schemaDoc: 'Allocation currency code',
            defaultValue: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
            kmigratorOptions: { null: false, default: `'${DEFAULT_RENT_CHARGE_CURRENCY_CODE}'` },
        },
        allocatedAt: {
            schemaDoc: 'Timestamp when this allocation was created',
            type: 'DateTimeUtc',
            isRequired: true,
        },
    },
    hooks: {
        resolveInput: ({ resolvedData, operation }) => {
            if (operation === 'create' && !resolvedData.allocatedAt) {
                resolvedData.allocatedAt = new Date().toISOString()
            }

            return resolvedData
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadPaymentAllocations,
        create: access.canManagePaymentAllocations,
        update: false,
        delete: false,
        auth: true,
    },
})

module.exports = {
    PaymentAllocation,
}