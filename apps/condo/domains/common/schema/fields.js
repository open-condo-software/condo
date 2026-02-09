const { GQLError } = require('@open-condo/keystone/errors')

const { ISO_CODES } = require('@condo/domains/common/constants/currencies')
const {
    PHONE_WRONG_FORMAT_ERROR,
    JSON_UNKNOWN_VERSION_ERROR,
    REQUIRED_NO_VALUE_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    COMMON_ERRORS,
} = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { UNIT_TYPES, FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const {
    ADDRESS_META_FIELD_GRAPHQL_TYPES,
    ADDRESS_META_SUBFIELDS_QUERY_LIST,
} = require('@condo/domains/property/schema/fields/AddressMetaField')

/** @deprecated use dvSenderPlugin! */
const DV_FIELD = {
    type: 'Integer',
    schemaDoc: 'Data structure Version',
    isRequired: true,
    kmigratorOptions: { null: false },
}

/** @deprecated use dvSenderPlugin ! */
const SENDER_FIELD = {
    type: 'Json',
    schemaDoc: 'Client-side device identification used for the anti-fraud detection. ' +
        'Example `{ "dv":1, "fingerprint":"VaxSw2aXZa"}`. ' +
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
}

/**
 * @deprecated use address service plugin
 * @see packages/keystone/plugins/addressService.js
 */
const ADDRESS_META_FIELD = {
    schemaDoc: 'Property address components',
    type: 'Json',
    extendGraphQLTypes: [ADDRESS_META_FIELD_GRAPHQL_TYPES],
    graphQLReturnType: 'AddressMetaField',
    graphQLAdminFragment: `{ ${ADDRESS_META_SUBFIELDS_QUERY_LIST} }`,
    isRequired: true,
    kmigratorOptions: { null: false },
    hooks: {
        validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
            if (!resolvedData.hasOwnProperty(fieldPath)) return addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${fieldPath}] Value is required`)
            const value = resolvedData[fieldPath]
            if (typeof value !== 'object' || value === null) {
                return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)
            }
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
    schemaDoc: 'Inhabitant/customer/person who has a problem or want to improve/order something. Not null if we have a registered client.',
    type: 'Relationship',
    ref: 'User',
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

const CONTACT_FIELD = {
    schemaDoc: 'Contact, that reported issue, described in this ticket',
    type: 'Relationship',
    ref: 'Contact',
    isRequired: false,
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

const CLIENT_NAME_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: 'Text',
    sensitive: true,
}

const CLIENT_EMAIL_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: 'Text',
    sensitive: true,
}

const getClientPhoneResolver = (allowLandLine = false) => async ({ resolvedData, fieldPath }) => {
    if (!resolvedData[fieldPath]) return resolvedData[fieldPath]
    const newValue = normalizePhone(resolvedData[fieldPath], allowLandLine)
    return newValue || resolvedData[fieldPath]
}

const getClientPhoneValidator = (allowLandLine = false) => async ({ resolvedData, addFieldValidationError, fieldPath }) => {
    const newValue = normalizePhone(resolvedData[fieldPath], allowLandLine)
    if (resolvedData[fieldPath] && newValue !== resolvedData[fieldPath]) {
        addFieldValidationError(`${PHONE_WRONG_FORMAT_ERROR}${fieldPath}] invalid format [Common] ${allowLandLine ? 'allowLandLine' : 'mobileOnly'}`)
    }
}

const CLIENT_PHONE_FIELD = {
    schemaDoc: 'Inhabitant/customer/person who has a problem. Sometimes we get a problem from an unregistered client, in such cases we have a null inside the `client` and just have something here. Or sometimes clients want to change it',
    type: 'Text',
    sensitive: true,
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
    type: 'Decimal',
    knexOptions: {
        scale: 8,
    },
}

const POSITIVE_MONEY_AMOUNT_FIELD = {
    ...MONEY_AMOUNT_FIELD,
    type: 'SignedDecimal',
    template: 'positive',
}

const NON_NEGATIVE_MONEY_FIELD = {
    ...MONEY_AMOUNT_FIELD,
    type: 'SignedDecimal',
    template: 'non-negative',
}

const CURRENCY_CODE_FIELD = {
    schemaDoc: 'Code of currency in ISO-4217 format',
    isRequired: true,
    type: 'Select',
    dataType: 'string',
    options: ISO_CODES,
}

// TODO(DOMA-1766) add constrains with this field! + context
const IMPORT_ID_FIELD = {
    schemaDoc: 'Id of object in external service which represents current item. Mostly used for internal needs of integration services for matching our objects with theirs',
    type: 'Text',
    isRequired: false,
}

const UNIT_TYPE_FIELD = {
    schemaDoc: 'Type of unit, such as parking lot or flat. Default value: "flat"',
    type: 'Select',
    options: UNIT_TYPES,
    dataType: 'string',
    isRequired: false,
    defaultValue: FLAT_UNIT_TYPE,
}

const PERCENT_FIELD = {
    schemaDoc: 'The percent value',
    type: 'Decimal',
    isRequired: false,
    hooks: {
        validateInput: ({ resolvedData, fieldPath, context }) => {
            const value = Number(resolvedData[fieldPath])
            if (value < 0 || value > 100) {
                throw new GQLError(COMMON_ERRORS.INVALID_PERCENT_VALUE, context)
            }
        },
    },
}

const getPhoneFieldHooks = ({ allowLandline }) => ({
    resolveInput: ({ resolvedData, fieldPath }) => {
        const newValue = normalizePhone(resolvedData[fieldPath], allowLandline)
        return newValue || resolvedData[fieldPath]
    },
    validateInput: ({ resolvedData, context, fieldPath }) => {
        const newCallerPhone = normalizePhone(resolvedData[fieldPath], allowLandline)

        if (resolvedData[fieldPath] && newCallerPhone !== resolvedData[fieldPath]) {
            throw new GQLError(
                { ...COMMON_ERRORS.WRONG_PHONE_FORMAT, variable: ['data', fieldPath] },
                context,
            )
        }
    },
})

const PHONE_FIELD = {
    schemaDoc: 'Normalized phone in E.164 format without spaces',
    type: 'Text',
    sensitive: true,
    hooks: getPhoneFieldHooks({ allowLandline: true }),
}

const PHONE_WITHOUT_LAND_LINE_FIELD = {
    ...PHONE_FIELD,
    hooks: getPhoneFieldHooks({ allowLandline: false }),
}

const META_FIELD = {
    type: 'Json',
    schemaDoc: 'Untyped metadata for this object. May be used by custom integrations.',
    isRequired: false,
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
    MONEY_AMOUNT_FIELD,
    CURRENCY_CODE_FIELD,
    POSITIVE_MONEY_AMOUNT_FIELD,
    NON_NEGATIVE_MONEY_FIELD,
    IMPORT_ID_FIELD,
    UNIT_TYPE_FIELD,
    PHONE_FIELD,
    PHONE_WITHOUT_LAND_LINE_FIELD,
    PERCENT_FIELD,
    META_FIELD,
}
