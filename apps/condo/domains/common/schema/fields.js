const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { Integer } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')
const { JSON_UNKNOWN_VERSION_ERROR, REQUIRED_NO_VALUE_ERROR, JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')

const DV_FIELD = {
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD = {
    type: Json,
    schemaDoc: 'Client-side devise identification used for the anti-fraud detection. ' +
        'Example `{ dv: 1, fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: (args) => {
            if (!hasValidJsonStructure(args, true, 1, {
                fingerprint: {
                    type: 'string',
                    presence: true,
                    length: { minimum: 5, maximum: 40 },
                },
            })) return
        },
    },
}


const ADDRESS_META_FIELD = {
    schemaDoc: 'Property address components',
    type: Json,
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
            if (!resolvedData.hasOwnProperty(fieldPath)) return addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${fieldPath}] Value is required`)
            const value = resolvedData[fieldPath]
            if (typeof value !== 'object' || value === null) { return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`) }
            const { dv } = value
            if (dv === 1) {
                // TODO(pahaz): need to checkIt!
            } else {
                // TODO(zuch): Turn on error after finishing add property
                console.error(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
                // return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
            }
        },
    },
}

module.exports = {
    DV_FIELD,
    SENDER_FIELD,
    ADDRESS_META_FIELD,
}
