const { OIDC_TOKEN_AUTH_BASIC_METHOD, OIDC_TOKEN_AUTH_METHODS } = require('@dev-api/domains/miniapp/constants/oidc')

const TOKEN_AUTH_METHOD_TYPES = `
    enum OIDCTokenAuthMethod {
        ${OIDC_TOKEN_AUTH_METHODS.join(' ')}
    }
`

const TOKEN_AUTH_METHOD_FIELD = {
    schemaDoc: 'Way of authenticating OAuth 2.0 Clients at the /oauth2/token',
    type: 'Text',
    isRequired: true,
    defaultValue: OIDC_TOKEN_AUTH_BASIC_METHOD,
    extendGraphQLTypes: TOKEN_AUTH_METHOD_TYPES,
    graphQLInputType: 'OIDCTokenAuthMethod',
    graphQLReturnType: 'OIDCTokenAuthMethod',
}

module.exports = {
    TOKEN_AUTH_METHOD_FIELD,
}