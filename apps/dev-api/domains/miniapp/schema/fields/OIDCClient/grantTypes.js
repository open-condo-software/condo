const Ajv = require('ajv')
const pick = require('lodash/pick')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { INVALID_GRANT_TYPES } = require('@dev-api/domains/miniapp/constants/errors')
const { OIDC_GRANT_TYPES } = require('@dev-api/domains/miniapp/constants/oidc')

const GRANT_TYPES_GQL_TYPES = `
    enum OIDCGrantType {
        ${OIDC_GRANT_TYPES.join(' ')}
    }
`

const GRANT_TYPES_JSON_SCHEMA = {
    type: 'array',
    items: {
        type: 'string',
        enum: OIDC_GRANT_TYPES,
    },
    minItems: 1,
    uniqueItems: true,
}

const ajv = new Ajv()
const validate = ajv.compile(GRANT_TYPES_JSON_SCHEMA)


const GRANT_TYPES_FIELD = {
    schemaDoc: `Array of available grant types for client. Can contain each of the following grants: ${OIDC_GRANT_TYPES}`,
    type: 'Json',
    isRequired: true,
    defaultValue: OIDC_GRANT_TYPES,
    extendGraphQLTypes: GRANT_TYPES_GQL_TYPES,
    graphQLInputType: '[OIDCGrantType!]',
    graphQLReturnType: '[OIDCGrantType!]',
    hooks: {
        validateInput ({ resolvedData, fieldPath, context }) {
            if (!validate(resolvedData[fieldPath])) {
                throw new GQLError({
                    code: BAD_USER_INPUT,
                    type: INVALID_GRANT_TYPES,
                    message: `"${fieldPath}" field validation error. JSON was not in the correct format. Errors: ${JSON.stringify(
                        validate.errors.map(error => pick(error, 'instancePath', 'message')), null, 2
                    )}`,
                }, context)
            }
        },
    },
}

module.exports = {
    GRANT_TYPES_FIELD,
}