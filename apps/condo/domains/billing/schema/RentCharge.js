const dayjs = require('dayjs')
const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/billing/access/RentCharge')
const {
    DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    RENT_CHARGE_STATUS_DRAFT,
    RENT_CHARGE_STATUSES,
} = require('@condo/domains/billing/constants/rent')
const { CURRENCY_CODE_FIELD, MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const ERRORS = {
    SCOPE_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'RENT_CHARGE_SCOPE_MISMATCH',
        message: 'Rent charge organization, property, occupancy and rental unit must match',
        messageForUser: 'api.billing.rentCharge.SCOPE_MISMATCH',
    },
}

const RentCharge = new GQLListSchema('RentCharge', {
    schemaDoc: 'Rent amount generated for an occupancy and billing period',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        occupancy: {
            schemaDoc: 'Occupancy this charge belongs to',
            type: 'Relationship',
            ref: 'Occupancy',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        rentalUnit: {
            schemaDoc: 'Rental unit charged for this period',
            type: 'Relationship',
            ref: 'RentalUnit',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        property: {
            schemaDoc: 'Property charged for this period',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        billingMonth: {
            schemaDoc: 'First day of the rent billing month',
            type: 'CalendarDay',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        periodStart: {
            schemaDoc: 'First day included into this rent charge period',
            type: 'CalendarDay',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        periodEnd: {
            schemaDoc: 'Last day included into this rent charge period',
            type: 'CalendarDay',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        dueDate: {
            schemaDoc: 'Date when this rent charge becomes due',
            type: 'CalendarDay',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        amount: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Amount charged for this billing period',
            isRequired: true,
        },

        currencyCode: {
            ...CURRENCY_CODE_FIELD,
            schemaDoc: 'Rent charge currency code',
            defaultValue: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
            kmigratorOptions: { null: false, default: `'${DEFAULT_RENT_CHARGE_CURRENCY_CODE}'` },
        },

        status: {
            schemaDoc: 'Rent charge lifecycle status',
            type: 'Select',
            options: RENT_CHARGE_STATUSES,
            dataType: 'string',
            isRequired: true,
            defaultValue: RENT_CHARGE_STATUS_DRAFT,
            kmigratorOptions: { null: false, default: `'${RENT_CHARGE_STATUS_DRAFT}'` },
        },

        invoice: {
            schemaDoc: 'Marketplace invoice generated from this rent charge',
            type: 'Relationship',
            ref: 'Invoice.rentCharges',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },

        billingReceipt: {
            schemaDoc: 'Billing receipt generated from this rent charge',
            type: 'Relationship',
            ref: 'BillingReceipt',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },
    },
    hooks: {
        resolveInput: async ({ resolvedData, existingItem }) => {
            const occupancyId = resolvedData.occupancy || (existingItem && existingItem.occupancy)
            const billingMonth = resolvedData.billingMonth || get(existingItem, 'billingMonth')

            if (occupancyId) {
                const occupancy = await getById('Occupancy', occupancyId)
                if (occupancy) {
                    resolvedData.organization = occupancy.organization
                    resolvedData.property = occupancy.property
                    resolvedData.rentalUnit = occupancy.rentalUnit
                }
            }

            if (billingMonth) {
                if (!resolvedData.periodStart) {
                    resolvedData.periodStart = dayjs(billingMonth).startOf('month').format('YYYY-MM-DD')
                }
                if (!resolvedData.periodEnd) {
                    resolvedData.periodEnd = dayjs(billingMonth).endOf('month').format('YYYY-MM-DD')
                }
                if (!resolvedData.dueDate) {
                    resolvedData.dueDate = billingMonth
                }
            }

            return resolvedData
        },
        validateInput: async ({ resolvedData, existingItem, context }) => {
            const item = { ...existingItem, ...resolvedData }
            const occupancy = await getById('Occupancy', get(item, 'occupancy'))

            if (
                occupancy.organization !== get(item, 'organization') ||
                occupancy.property !== get(item, 'property') ||
                occupancy.rentalUnit !== get(item, 'rentalUnit')
            ) {
                throw new GQLError(ERRORS.SCOPE_MISMATCH, context)
            }
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['occupancy', 'billingMonth'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'rent_charge_unique_occupancy_billing_month',
            },
        ],
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadRentCharges,
        create: access.canManageRentCharges,
        update: access.canManageRentCharges,
        delete: false,
        auth: true,
    },
})

module.exports = {
    RentCharge,
}
