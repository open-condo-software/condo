const { v4: uuid } = require('uuid')

const { Text, Relationship, Uuid, Integer, Select } = require('@keystonejs/fields')

const access = require('@core/keystone/access')
const { GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { ORGANIZATION_OWNED_FIELD, SENDER_FIELD, DV_FIELD, UID_FIELD } = require('./_common')
const { hasRequestAndDbFields } = require('../utils/validation.utils')
const { DV_UNKNOWN_VERSION_ERROR, JSON_UNKNOWN_VERSION_ERROR, REQUIRED_NO_VALUE_ERROR, JSON_EXPECT_OBJECT_ERROR } = require('../constants/errors')

const ACCESS_TO_ALL = {
    read: true,
    create: access.userIsAuthenticated,
    update: access.userIsAuthenticated,
    delete: access.userIsAuthenticated,
    auth: true,
}

const Property = new GQLListSchema('Property', {
    schemaDoc: 'Common property. The property is divided into separate `unit` parts, each of which can be owned by an independent owner. Community farm, residential buildings, or a cottage settlement',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,
        organization: ORGANIZATION_OWNED_FIELD,
        // avatar
        name: {
            type: Text,
            isRequired: true,
        },
        address: {
            type: Text,
            isRequired: true,
            // TODO(pahaz): need to checkIt!
        },
        addressMeta: {
            type: Json,
            isRequired: true,
            schemaDoc: 'Property address components',
            kmigratorOptions: { null: false },
            hooks: {
                validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                    if (!resolvedData.hasOwnProperty(fieldPath)) return addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${fieldPath}] Value is required`)
                    const value = resolvedData[fieldPath]
                    if (typeof value !== 'object' || value === null) {return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)}
                    const { dv } = value
                    if (dv === 1) {
                        // TODO(pahaz): need to checkIt!
                    } else {
                        return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
                    }
                },
            },
        },
        type: {
            type: Select,
            isRequired: true,
            options: 'building, village',
            schemaDoc: 'Common property type',
        },
        map: {
            type: Json,
            isRequired: false,
            schemaDoc: 'Property map/schema',
            hooks: {
                validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                    if (!resolvedData.hasOwnProperty(fieldPath)) return // skip if on value
                    const value = resolvedData[fieldPath]
                    if (value === null) return // null is OK
                    if (typeof value !== 'object') {return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)}
                    const { dv } = value
                    if (dv === 1) {
                        // TODO(pahaz): need to checkIt! sections and so on
                    } else {
                        return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
                    }
                },
            },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: ACCESS_TO_ALL,
    hooks: {
        validateInput: ({ resolvedData, existingItem, addValidationError }) => {
            if (!hasRequestAndDbFields(['dv', 'sender'], ['organization', 'type', 'name', 'address', 'addressMeta'], resolvedData, existingItem, addValidationError)) return
            const { dv } = resolvedData
            if (dv === 1) {
                // NOTE: version 1 specific translations. Don't optimize this logic
            } else {
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
            }
        },
    },
})

const PropertyUnit = new GQLListSchema('PropertyUnit', {
    schemaDoc: 'Property unit. The property is divided into separate `unit` parts, each of which can be owned by an independent owner',
    fields: {
        uid: UID_FIELD,
        dv: DV_FIELD,
        sender: SENDER_FIELD,
        property: {
            type: Relationship,
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false },
        },
        map: {
            type: Json,
            isRequired: true,
            schemaDoc: 'Unit map/schema',
            kmigratorOptions: { null: false },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: true,
        create: access.userIsAuthenticated,
        update: access.userIsAuthenticated,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Property,
}
