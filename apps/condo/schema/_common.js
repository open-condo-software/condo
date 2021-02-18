const { Relationship, Integer } = require('@keystonejs/fields')

const { Json } = require('@core/keystone/fields')

const { JSON_EXPECT_OBJECT_ERROR } = require('../constants/errors')
const { JSON_WRONG_VERSION_FORMAT_ERROR } = require('../constants/errors')
const { REQUIRED_NO_VALUE_ERROR } = require('../constants/errors')
const { JSON_UNKNOWN_VERSION_ERROR } = require('../constants/errors')

const DV_FIELD = {
    factory: () => 1,
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD = {
    factory: () => JSON.stringify({ dv: '1', fingerprint: 'VaxSw2aXZa', userId: 'pL7dnHUPGX1KpRsOXun' }),
    type: Json,
    schemaDoc: 'Client-side devise identification used for the anti-fraud detection. ' +
        'Example `{ dv: \'1\', fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
            if (!resolvedData.hasOwnProperty(fieldPath)) return addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${fieldPath}] Value is required`)
            const value = resolvedData[fieldPath]
            if (typeof value !== 'object' || value === null) return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] Expect JSON Object`)
            const { dv } = value
            if (dv === 1) {
                const { fingerprint } = value
                if (!fingerprint || typeof fingerprint !== 'string') return addFieldValidationError(`${JSON_WRONG_VERSION_FORMAT_ERROR}${fieldPath}] Wrong \`fingerprint\` format inside JSON Object`)
                if (fingerprint.length < 5 || fingerprint.length > 50) return addFieldValidationError(`${JSON_WRONG_VERSION_FORMAT_ERROR}${fieldPath}] The \`fingerprint\` length is short or large (50 > length > 5)`)
                if (!/^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,50}$/.test(fingerprint)) return addFieldValidationError(`${JSON_WRONG_VERSION_FORMAT_ERROR}${fieldPath}] The \`fingerprint\` charset allow only: a-zA-Z0-9!#$%()*+-;=,:[]/.?@^_\`{|}~`)
            } else {
                return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
            }
        },
    },
}

const ORGANIZATION_OWNED_FIELD = {
    schemaDoc: 'Ref to the organization. The object will be deleted if the organization ceases to exist',
    type: Relationship,
    ref: 'Organization',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    // TODO(pahaz): check access to organization!
    access: {
        read: true,
        create: true,
        update: true,
    },
}

const COMMON_AND_ORGANIZATION_OWNED_FIELD = {
    schemaDoc: 'Ref to the organization. If this ref is null the object is common for all organizations',
    type: Relationship,
    ref: 'Organization',
    isRequired: true,
    kmigratorOptions: { null: true, on_delete: 'models.CASCADE' },
    // TODO(pahaz): check access to organization (can't create without organization)!
    access: {
        read: true,
        create: true,
        update: true,
    },
}

module.exports = {
    DV_FIELD,
    SENDER_FIELD,
    ORGANIZATION_OWNED_FIELD,
    COMMON_AND_ORGANIZATION_OWNED_FIELD,
}
