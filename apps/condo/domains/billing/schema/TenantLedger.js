const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/TenantLedger')
const { TENANT_LEDGER_STATUS_ACTIVE, TENANT_LEDGER_STATUSES } = require('@condo/domains/billing/constants/ledger')
const { DEFAULT_RENT_CHARGE_CURRENCY_CODE } = require('@condo/domains/billing/constants/rent')
const { CURRENCY_CODE_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const TenantLedger = new GQLListSchema('TenantLedger', {
    schemaDoc: 'Ledger account for tenant rent accounting',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,
        tenant: {
            schemaDoc: 'Tenant this ledger belongs to',
            type: 'Relationship',
            ref: 'Resident',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        currencyCode: {
            ...CURRENCY_CODE_FIELD,
            schemaDoc: 'Ledger currency code',
            defaultValue: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
            kmigratorOptions: { null: false, default: `'${DEFAULT_RENT_CHARGE_CURRENCY_CODE}'` },
        },
        status: {
            schemaDoc: 'Ledger status',
            type: 'Select',
            options: TENANT_LEDGER_STATUSES,
            dataType: 'string',
            isRequired: true,
            defaultValue: TENANT_LEDGER_STATUS_ACTIVE,
            kmigratorOptions: { null: false, default: `'${TENANT_LEDGER_STATUS_ACTIVE}'` },
        },
        entries: {
            schemaDoc: 'Posted ledger entries',
            type: 'Relationship',
            ref: 'LedgerEntry.ledger',
            many: true,
            access: { create: false, update: false },
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['organization', 'tenant', 'currencyCode'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'tenant_ledger_unique_org_tenant_currency',
            },
        ],
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadTenantLedgers,
        create: access.canManageTenantLedgers,
        update: access.canManageTenantLedgers,
        delete: false,
        auth: true,
    },
})

module.exports = {
    TenantLedger,
}