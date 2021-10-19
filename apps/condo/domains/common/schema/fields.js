const { Relationship, Select, Integer, Text } = require('@keystonejs/fields')
const { Decimal } = require('@keystonejs/fields')
const { PHONE_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')
const { Json } = require('@core/keystone/fields')
const { JSON_UNKNOWN_VERSION_ERROR, REQUIRED_NO_VALUE_ERROR, JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')
const { ADDRESS_META_FIELD_GRAPHQL_TYPES } = require('@condo/domains/property/schema/fields/AddressMetaField')
const { ISO_CODES } = require('../constants/currencies')

const DV_FIELD = {
    type: Integer,
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

const SENDER_FIELD = {
    type: Json,
    schemaDoc: 'Client-side device identification used for the anti-fraud detection. ' +
        'Example `{ dv: 1, fingerprint: \'VaxSw2aXZa\'}`. ' +
        'Where the `fingerprint` should be the same for the same devices and it\'s not linked to the user ID. ' +
        'It\'s the device ID like browser / mobile application / remote system',
    graphQLInputType: 'SenderFieldInput',
    graphQLReturnType: 'SenderField',
    graphQLAdminFragment: '{ dv fingerprint }',
    extendGraphQLTypes: [
        'type SenderField { dv: Int!, fingerprint: String! }',
        'input SenderFieldInput { dv: Int!, fingerprint: String! }',
    ],
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: (args) => {
            if (!hasValidJsonStructure(args, true, 1, {
                fingerprint: {
                    presence: true,
                    format: /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/,
                    length: { minimum: 5, maximum: 42 },
                },
            })) return
        },
    },
}


const ADDRESS_META_FIELD = {
    schemaDoc: 'Property address components',
    type: Json,
    extendGraphQLTypes: [ADDRESS_META_FIELD_GRAPHQL_TYPES],
    graphQLReturnType: 'AddressMetaField',
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

const CLIENT_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client',
    type: Relationship,
    ref: 'User',
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

const CONTACT_FIELD = {
    schemaDoc: 'Contact, that reported issue, described in this ticket',
    type: Relationship,
    ref: 'Contact',
    isRequired: false,
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

const CLIENT_NAME_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: Text,
}

const CLIENT_EMAIL_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: Text,
}

const getClientPhoneResolver = (allowLandLine = false) => async ({ resolvedData }) => {
    if (!resolvedData['clientPhone']) return resolvedData['clientPhone']
    const newValue = normalizePhone(resolvedData['clientPhone'], allowLandLine)
    return newValue || resolvedData['clientPhone']
}

const getClientPhoneValidator = (allowLandLine = false) => async ({ resolvedData, addFieldValidationError }) => {
    const newValue = normalizePhone(resolvedData['clientPhone'], allowLandLine)
    if (resolvedData['clientPhone'] && newValue !== resolvedData['clientPhone']) {
        addFieldValidationError(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format [Common] ${allowLandLine ? 'allowLandLine' : 'mobileOnly'}`)
    }
}

const CLIENT_PHONE_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: Text,
    hooks: {
        resolveInput: getClientPhoneResolver(),
        validateInput: getClientPhoneValidator(),
    },
}

const CLIENT_PHONE_LANDLINE_FIELD = {
    ...CLIENT_PHONE_FIELD,
    hooks: {
        resolveInput: getClientPhoneResolver(true),
        validateInput: getClientPhoneValidator(true),
    },
}

const MONEY_AMOUNT_FIELD = {
    schemaDoc: 'Money field',
    type: Decimal,
    knexOptions: {
        scale: 8,
    },
}

const CURRENCY_CODE_FIELD = {
    schemaDoc: 'Code of currency in ISO-4217 format',
    isRequired: true,
    type: Select,
    dataType: 'string',
    options: ISO_CODES,
}


module.exports = {
    DV_FIELD,
    SENDER_FIELD,
    ADDRESS_META_FIELD,
    CLIENT_FIELD,
    CONTACT_FIELD,
    CLIENT_NAME_FIELD,
    CLIENT_EMAIL_FIELD,
    CLIENT_PHONE_FIELD,
    CLIENT_PHONE_LANDLINE_FIELD,
    MONEY_FIELD,
    CURRENCY_CODE_FIELD,
}
