const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const { MONEY_AMOUNT_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const access = require('@condo/domains/property/access/RentalUnit')
const { RENTAL_UNIT_TYPES, RENTAL_UNIT_TYPE_APARTMENT } = require('@condo/domains/property/constants/rental')

const ERRORS = {
    PROPERTY_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'RENTAL_UNIT_PROPERTY_MISMATCH',
        message: 'Rental unit parent must belong to the same property',
        messageForUser: 'api.property.rentalUnit.PROPERTY_MISMATCH',
    },
    ORGANIZATION_MISMATCH: {
        code: BAD_USER_INPUT,
        type: 'RENTAL_UNIT_ORGANIZATION_MISMATCH',
        message: 'Rental unit property must belong to the same organization',
        messageForUser: 'api.property.rentalUnit.ORGANIZATION_MISMATCH',
    },
    INVALID_CAPACITY: {
        code: BAD_USER_INPUT,
        type: 'RENTAL_UNIT_INVALID_CAPACITY',
        message: 'Rentable unit capacity must be greater than zero',
        messageForUser: 'api.property.rentalUnit.INVALID_CAPACITY',
    },
}

const RentalUnit = new GQLListSchema('RentalUnit', {
    schemaDoc: 'Canonical rentable unit inside a property. Supports nested apartment, floor, room and bed structures.',
    fields: {
        organization: ORGANIZATION_OWNED_FIELD,

        property: {
            schemaDoc: 'Property this rental unit belongs to',
            type: 'Relationship',
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        parent: {
            schemaDoc: 'Parent rental unit for hierarchical layouts',
            type: 'Relationship',
            ref: 'RentalUnit.children',
            isRequired: false,
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },

        children: {
            schemaDoc: 'Nested rental units',
            type: 'Relationship',
            ref: 'RentalUnit.parent',
            many: true,
            access: { create: false, update: false },
        },

        name: {
            schemaDoc: 'Human-readable rental unit label',
            type: 'Text',
            isRequired: true,
            kmigratorOptions: { null: false },
        },

        unitType: {
            schemaDoc: 'Rental unit type',
            type: 'Select',
            options: RENTAL_UNIT_TYPES,
            dataType: 'string',
            isRequired: true,
            defaultValue: RENTAL_UNIT_TYPE_APARTMENT,
            kmigratorOptions: { null: false, default: `'${RENTAL_UNIT_TYPE_APARTMENT}'` },
        },

        rentable: {
            schemaDoc: 'Whether this unit can be occupied directly',
            type: 'Checkbox',
            defaultValue: true,
            kmigratorOptions: { default: true },
        },

        capacity: {
            schemaDoc: 'Maximum active occupants for this rentable unit',
            type: 'Integer',
            isRequired: true,
            defaultValue: 1,
            kmigratorOptions: { null: false, default: 1 },
        },

        defaultMonthlyRate: {
            ...MONEY_AMOUNT_FIELD,
            schemaDoc: 'Default monthly rent for this unit',
            isRequired: false,
        },

        meta: {
            schemaDoc: 'Additional rental-unit metadata',
            type: 'Json',
            isRequired: false,
        },
    },
    hooks: {
        validateInput: async ({ resolvedData, existingItem, operation, context }) => {
            const item = { ...existingItem, ...resolvedData }

            if (get(item, 'rentable') && Number(get(item, 'capacity')) < 1) {
                throw new GQLError(ERRORS.INVALID_CAPACITY, context)
            }

            const parentId = get(item, 'parent')
            const propertyId = get(item, 'property')
            const organizationId = get(item, 'organization')

            if (propertyId && organizationId) {
                const property = await getById('Property', propertyId)

                if (property && property.organization !== organizationId) {
                    throw new GQLError(ERRORS.ORGANIZATION_MISMATCH, context)
                }
            }

            if (parentId && propertyId) {
                const parent = await getById('RentalUnit', parentId)

                if (parent && parent.property !== propertyId) {
                    throw new GQLError(ERRORS.PROPERTY_MISMATCH, context)
                }
            }

            if (operation === 'update' && get(existingItem, 'id') && get(item, 'parent') === get(existingItem, 'id')) {
                throw new GQLError(ERRORS.PROPERTY_MISMATCH, context)
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadRentalUnits,
        create: access.canManageRentalUnits,
        update: access.canManageRentalUnits,
        delete: false,
        auth: true,
    },
})

module.exports = {
    RentalUnit,
}
