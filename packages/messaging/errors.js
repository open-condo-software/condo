const {
    GQLErrorCode: {
        INTERNAL_ERROR,
        UNAUTHENTICATED,
        FORBIDDEN,
        TOO_MANY_REQUESTS,
    },
} = require('@open-condo/keystone/errors')

const AUTHORIZATION_REQUIRED = 'AUTHORIZATION_REQUIRED'
const NO_ORGANIZATION_SELECTED = 'NO_ORGANIZATION_SELECTED'
const INVALID_ORGANIZATION_SELECTION = 'INVALID_ORGANIZATION_SELECTION'
const ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND'
const MESSAGING_NOT_CONFIGURED = 'MESSAGING_NOT_CONFIGURED'
const TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED'
const CHANNELS_FETCH_FAILED = 'CHANNELS_FETCH_FAILED'
const RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'

const ERRORS = {
    AUTHORIZATION_REQUIRED: {
        code: UNAUTHENTICATED,
        type: AUTHORIZATION_REQUIRED,
        message: 'Authorization is required',
    },
    NO_ORGANIZATION_SELECTED: {
        code: UNAUTHENTICATED,
        type: NO_ORGANIZATION_SELECTED,
        message: 'No organization selected',
    },
    INVALID_ORGANIZATION_SELECTION: {
        code: FORBIDDEN,
        type: INVALID_ORGANIZATION_SELECTION,
        message: 'Invalid organization selection',
    },
    ORGANIZATION_NOT_FOUND: {
        code: INTERNAL_ERROR,
        type: ORGANIZATION_NOT_FOUND,
        message: 'Organization not found',
    },
    MESSAGING_NOT_CONFIGURED: {
        code: INTERNAL_ERROR,
        type: MESSAGING_NOT_CONFIGURED,
        message: 'Messaging is not configured',
    },
    TOKEN_GENERATION_FAILED: {
        code: INTERNAL_ERROR,
        type: TOKEN_GENERATION_FAILED,
        message: 'Failed to generate messaging token',
    },
    CHANNELS_FETCH_FAILED: {
        code: INTERNAL_ERROR,
        type: CHANNELS_FETCH_FAILED,
        message: 'Failed to get available channels',
    },
    RATE_LIMIT_EXCEEDED: {
        code: TOO_MANY_REQUESTS,
        type: RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
    },
}

module.exports = { ERRORS }
