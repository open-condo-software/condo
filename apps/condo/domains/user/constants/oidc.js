// NOTE: List of all combinations: https://openid.net/specs/openid-connect-core-1_0.html#Authentication
// List of recommended combinations: https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#responsetypes

const ID_TOKEN_ONLY_RESPONSE_TYPE = 'id_token'
const ID_TOKEN_WITH_TOKEN_RESPONSE_TYPE = 'id_token token'
const IMPLICIT_FLOW_SUPPORTED_RESPONSE_TYPES = [
    ID_TOKEN_ONLY_RESPONSE_TYPE,
    ID_TOKEN_WITH_TOKEN_RESPONSE_TYPE,
]

const CODE_ONLY_RESPONSE_TYPE = 'code'
const AUTH_CODE_FLOW_SUPPORTED_RESPONSE_TYPES = [
    CODE_ONLY_RESPONSE_TYPE,
]

const CODE_WITH_TOKEN_RESPONSE_TYPE = 'code id_token'
const HYBRID_FLOW_SUPPORTED_RESPONSE_TYPES = [
    CODE_WITH_TOKEN_RESPONSE_TYPE,
]

const CONDO_SUPPORTED_RESPONSE_TYPES = [
    ...IMPLICIT_FLOW_SUPPORTED_RESPONSE_TYPES,
    ...AUTH_CODE_FLOW_SUPPORTED_RESPONSE_TYPES,
    ...HYBRID_FLOW_SUPPORTED_RESPONSE_TYPES,
]

module.exports = {
    CONDO_SUPPORTED_RESPONSE_TYPES,
}