const Ajv = require('ajv')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { CONDO_SUPPORTED_RESPONSE_TYPES } = require('@condo/domains/user/constants/oidc')
const { INVALID_RESPONSE_TYPES } = require('@dev-api/domains/miniapp/constants/errors')

const RESPONSE_TYPES_JSON_SCHEMA = {
    type: 'array',
    items: {
        type: 'string',
        enum: CONDO_SUPPORTED_RESPONSE_TYPES,
    },
    minItems: 1,
    uniqueItems: true,
}

const ajv = new Ajv()
const validate = ajv.compile(RESPONSE_TYPES_JSON_SCHEMA)

const RESPONSE_TYPES_FIELD = {
    schemaDoc:
        `Array of available response types, can be one of the following: ${CONDO_SUPPORTED_RESPONSE_TYPES.join(', ')}`,
    type: 'Json',
    isRequired: true,
    defaultValue: CONDO_SUPPORTED_RESPONSE_TYPES,
    graphQLInputType: '[String!]',
    graphQLReturnType: '[String!]',
    hooks: {
        validateInput ({ resolvedData, fieldPath, context }) {
            if (!validate(resolvedData[fieldPath])) {
                const aggregatedMessage = validate.errors.map(err => err.message).join(', ')
                throw new GQLError({
                    code: BAD_USER_INPUT,
                    type: INVALID_RESPONSE_TYPES,
                    message: `"${fieldPath}" field validation error. JSON was not in the correct format. ${aggregatedMessage}`,
                }, context)
            }
        },
    },
}

module.exports = {
    RESPONSE_TYPES_FIELD,
}