const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { find, GQLListSchema, getById } = require('@open-condo/keystone/schema')

const { MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const access = require('@condo/domains/resident/access/Occupancy')
const {
    BILLING_FREQUENCIES,
    BILLING_FREQUENCY_MONTHLY,
    OCCUPANCY_STATUS_ACTIVE,
    OCCUPANCY_STATUSES,
} = require('@condo/domains/resident/constants/occupancy')
const { findActiveOccupancies, isActiveOccupancyData } = require('@condo/domains/resident/utils/serverSchema/activeOccupancy')

const ERRORS = {
    UNIT_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_UNIT_REQUIRED',
        message: 'Occupancy must be linked to a rentable rental unit',
        messageForUser: 'api.resident.occupancy.UNIT_REQUIRED',
    },
    OVERLAPPING_TENANT: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_OVERLAPPING_TENANT',
        message: 'Tenant already has an active occupancy',
        messageForUser: 'api.resident.occupancy.OVERLAPPING_TENANT',
    },
    UNIT_CAPACITY_EXCEEDED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_UNIT_CAPACITY_EXCEEDED',
        message: 'Rental unit active occupancy capacity is exceeded',
        messageForUser: 'api.resident.occupancy.UNIT_CAPACITY_EXCEEDED',
    },
    SCOPE_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_SCOPE_MISMATCH',
        message: 'Occupancy organization, property and rental unit must match',
        messageForUser: 'api.resident.occupancy.SCOPE_MISMATCH',
    },
    BILLING_POLICY_REQUIRED: {
        code: BAD_USER_INPUT,
        type: 'OCCUPANCY_BILLING_POLICY_REQUIRED',
        message: 'Billing policy must exist before activating occupancy',
        messageForUser: 'api.resident.occupancy.BILLING_POLICY_REQUIRED',
    },
}

const Occupancy = new GQLListSchema('Occupancy', {
    schemaDoc: 'Time-bound tenant occupancy agreement for a rental unit',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        tenant: {
            schemaDoc: 'Tenant profile',
            type: 'Relationship',
            ref: 'Resident.occupancies',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        property: {
            schemaDoc: 'Property occupied by tenant',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        rentalUnit: {
            schemaDoc: 'Rental unit occupied by tenant',
            type: 'Relationship',
            ref: 'RentalUnit',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },

        startDate: {
            schemaDoc: 'Occupancy start date',
            type: 'CalendarDay',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        expectedEndDate: {
            schemaDoc: 'Expected occupancy end date',
            type: 'CalendarDay',
            isRequired: false,
        },

        actualEndDate: {
            schemaDoc: 'Actual occupancy end date',
            type: 'CalendarDay',
            isRequired: false,
        },

        billingFrequency: {
            schemaDoc: 'Rent billing frequency for this occupancy',
            type: 'Select',
            options: BILLING_FREQUENCIES,
            dataType: 'string',
            isRequired: true,
            defaultValue: BILLING_FREQUENCY_MONTHLY,
            kmigratorOptions: { null: false, default: `'${BILLING_FREQUENCY_MONTHLY}'` },
        },

        monthlyRate: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Monthly rent agreed for this occupancy',
            isRequired: true,
        },

        status: {
            schemaDoc: 'Occupancy lifecycle status',
            type: 'Select',
            options: OCCUPANCY_STATUSES,
            dataType: 'string',
            isRequired: true,
            defaultValue: OCCUPANCY_STATUS_ACTIVE,
            kmigratorOptions: { null: false, default: `'${OCCUPANCY_STATUS_ACTIVE}'` },
        },
    },
    hooks: {
        resolveInput: async ({ resolvedData, existingItem }) => {
            const rentalUnitId = get(resolvedData, 'rentalUnit') || get(existingItem, 'rentalUnit')

            if (rentalUnitId && !get(resolvedData, 'property')) {
                const rentalUnit = await getById('RentalUnit', rentalUnitId)

                if (rentalUnit) {
                    resolvedData.property = rentalUnit.property
                }
            }

            return resolvedData
        },
        validateInput: async ({ resolvedData, existingItem, operation, context }) => {
            const item = { ...existingItem, ...resolvedData }
            const rentalUnitId = get(item, 'rentalUnit')
            const tenantId = get(item, 'tenant')
            const status = get(item, 'status')

            const rentalUnit = rentalUnitId && await getById('RentalUnit', rentalUnitId)

            if (!rentalUnit || (status === OCCUPANCY_STATUS_ACTIVE && !rentalUnit.rentable)) {
                throw new GQLError(ERRORS.UNIT_REQUIRED, context)
            }

            if (rentalUnit.organization !== get(item, 'organization') || rentalUnit.property !== get(item, 'property')) {
                throw new GQLError(ERRORS.SCOPE_MISMATCH, context)
            }

            if (status === OCCUPANCY_STATUS_ACTIVE) {
                const [billingPolicy] = await find('BillingPolicy', {
                    property: { id: get(item, 'property') },
                    deletedAt: null,
                })

                if (!billingPolicy) {
                    throw new GQLError(ERRORS.BILLING_POLICY_REQUIRED, context)
                }
            }

            if (!isActiveOccupancyData(item)) return

            const ownId = operation === 'update' ? get(existingItem, 'id') : null

            if (!get(context, '_allowConcurrentOccupancy')) {
                const activeTenantOccupancies = await findActiveOccupancies({ tenantId })

                if (activeTenantOccupancies.some(occupancy => occupancy.id !== ownId)) {
                    throw new GQLError(ERRORS.OVERLAPPING_TENANT, context)
                }
            }

            const activeUnitOccupancies = await findActiveOccupancies({ rentalUnitId })

            if (activeUnitOccupancies.filter(occupancy => occupancy.id !== ownId).length >= Number(rentalUnit.capacity)) {
                throw new GQLError(ERRORS.UNIT_CAPACITY_EXCEEDED, context)
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadOccupancies,
        create: access.canManageOccupancies,
        update: access.canManageOccupancies,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Occupancy,
}
