const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const { RENT_PAYMENT_METHODS, RENT_PAYMENT_PROVIDERS } = require('@condo/domains/acquiring/constants/rentPayment')
const access = require('@condo/domains/billing/access/PaymentReceipt')
const { DEFAULT_RENT_CHARGE_CURRENCY_CODE } = require('@condo/domains/billing/constants/rent')
const { CURRENCY_CODE_FIELD, MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const PaymentReceipt = new GQLListSchema('PaymentReceipt', {
    schemaDoc: 'Receipt generated after rent payment confirmation',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,
        tenant: {
            schemaDoc: 'Tenant this receipt was issued to',
            type: 'Relationship',
            ref: 'Resident',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        payment: {
            schemaDoc: 'Confirmed payment this receipt belongs to',
            type: 'Relationship',
            ref: 'Payment',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        ledger: {
            schemaDoc: 'Tenant ledger credited by this payment',
            type: 'Relationship',
            ref: 'TenantLedger',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        ledgerEntries: {
            schemaDoc: 'Ledger entries represented by this receipt',
            type: 'Relationship',
            ref: 'LedgerEntry.receipt',
            many: true,
            access: { create: false, update: false },
        },
        number: {
            schemaDoc: 'Receipt number in ORGCODE/YEAR/SEQUENCE format',
            type: 'Text',
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        year: {
            schemaDoc: 'Receipt sequence year',
            type: 'Integer',
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        sequence: {
            schemaDoc: 'Receipt sequence inside organization and year',
            type: 'Integer',
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        amount: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Receipt amount',
            isRequired: true,
        },
        currencyCode: {
            ...CURRENCY_CODE_FIELD,
            schemaDoc: 'Receipt currency code',
            defaultValue: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
            kmigratorOptions: { null: false, default: `'${DEFAULT_RENT_CHARGE_CURRENCY_CODE}'` },
        },
        issuedAt: {
            schemaDoc: 'Receipt issue timestamp',
            type: 'DateTimeUtc',
            isRequired: true,
        },
        paymentMethod: {
            schemaDoc: 'Payment method used by tenant',
            type: 'Select',
            options: RENT_PAYMENT_METHODS,
            dataType: 'string',
            isRequired: false,
        },
        provider: {
            schemaDoc: 'Payment provider that confirmed payment',
            type: 'Select',
            options: RENT_PAYMENT_PROVIDERS,
            dataType: 'string',
            isRequired: false,
        },
        reference: {
            schemaDoc: 'Manual or provider payment reference shown on receipt',
            type: 'Text',
            isRequired: false,
        },
        balanceAfterPayment: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Tenant ledger balance after this payment was applied',
            isRequired: false,
        },
    },
    hooks: {
        resolveInput: ({ resolvedData, operation }) => {
            if (operation === 'create' && !resolvedData.issuedAt) {
                resolvedData.issuedAt = new Date().toISOString()
            }

            return resolvedData
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['organization', 'year', 'sequence'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'payment_receipt_unique_org_year_sequence',
            },
            {
                type: 'models.UniqueConstraint',
                fields: ['payment'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'payment_receipt_unique_payment',
            },
        ],
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadPaymentReceipts,
        create: access.canManagePaymentReceipts,
        update: false,
        delete: false,
        auth: true,
    },
})

module.exports = {
    PaymentReceipt,
}