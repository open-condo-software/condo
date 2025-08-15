const { GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR, NOT_FOUND } } = require('@open-condo/keystone/errors')

const MISSING_QUERY_PARAMETER = 'MISSING_QUERY_PARAMETER'
const INVALID_USER_TYPE = 'INVALID_USER_TYPE'
const INVALID_FIELD_MAPPING = 'INVALID_FIELD_MAPPING'
const EXTERNAL_IDENTITY_BLOCKED = 'EXTERNAL_IDENTITY_BLOCKED'
const INVALID_USER_SHAPE = 'INVALID_USER_SHAPE'
const NO_USER_TYPE_IN_CALLBACK = 'NO_USER_TYPE_IN_CALLBACK'
const INVALID_IDENTITY_PROVIDER_INFO = 'INVALID_IDENTITY_PROVIDER_INFO'
const INVALID_USER_DATA = 'INVALID_USER_DATA'
const INVALID_PARAMETER = 'INVALID_PARAMETER'
const AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED'
const UNKNOWN_PROVIDER = 'UNKNOWN_PROVIDER'
const UNKNOWN_CONFIRM_TOKEN_TYPE = 'UNKNOWN_CONFIRM_TOKEN_TYPE'

const ERRORS = {
    MISSING_QUERY_PARAMETER: {
        code: BAD_USER_INPUT,
        type: MISSING_QUERY_PARAMETER,
        message: 'Query parameter "{parameter}" is missing in request',
    },
    INVALID_USER_TYPE: {
        code: BAD_USER_INPUT,
        type: INVALID_USER_TYPE,
        message: 'Invalid user type provided. Expected to be one of the following: {allowedTypes}',
    },
    INVALID_FIELD_MAPPING: {
        code: INTERNAL_ERROR,
        type: INVALID_FIELD_MAPPING,
        message: 'Invalid field mapping provided to syncUser',
    },
    EXTERNAL_IDENTITY_BLOCKED: {
        code: BAD_USER_INPUT,
        type: EXTERNAL_IDENTITY_BLOCKED,
        message: 'Its not possible to sign in using this account',
    },
    INVALID_USER_SHAPE: {
        code: INTERNAL_ERROR,
        type: INVALID_USER_SHAPE,
        message: 'User shape was invalid',
    },
    NO_USER_TYPE_IN_CALLBACK: {
        code: BAD_USER_INPUT,
        type: NO_USER_TYPE_IN_CALLBACK,
        message: 'userType parameter was not found saved between requests, pass it via query parameters explicitly or visit /api/auth/{provider} first',
    },
    INVALID_IDENTITY_PROVIDER_INFO: {
        code: INTERNAL_ERROR,
        type: INVALID_IDENTITY_PROVIDER_INFO,
        message: 'Invalid identity provider info',
    },
    INVALID_USER_DATA: {
        code: INTERNAL_ERROR,
        type: INVALID_USER_DATA,
        message: 'Invalid user data received from auth provider',
    },
    INVALID_PARAMETER: {
        code: BAD_USER_INPUT,
        type: INVALID_PARAMETER,
        message: 'Invalid {parameter}',
    },
    AUTHORIZATION_FAILED: {
        code: INTERNAL_ERROR,
        type: AUTHORIZATION_FAILED,
        message: 'Failed to authorize user',
    },
    UNKNOWN_PROVIDER: {
        code: NOT_FOUND,
        type: UNKNOWN_PROVIDER,
        message: 'Unknown auth provider: {provider}',
    },
    UNKNOWN_CONFIRM_TOKEN_TYPE: {
        code: INTERNAL_ERROR,
        type: UNKNOWN_CONFIRM_TOKEN_TYPE,
        message: 'Unknown confirm action token type',
    },
}

module.exports = {
    ERRORS,
}