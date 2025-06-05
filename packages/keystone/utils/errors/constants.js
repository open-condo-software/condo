
// Generic error, that something went wrong at server side, though user input was correct
const INTERNAL_ERROR = 'INTERNAL_ERROR'
// No auth token or incorrect authentication or not authenticated
const UNAUTHENTICATED = 'UNAUTHENTICATED'
// Access denied
const FORBIDDEN = 'FORBIDDEN'
// User input cannot be processed by server by following reasons:
// wrong format, not enough data, conflicts with data storage constraints (duplicates etc)
const BAD_USER_INPUT = 'BAD_USER_INPUT'
// Too Many Requests
const TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS'
// Too Large Requests
const PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE'

/**
 * First level of error classification, used in custom GraphQL queries or mutations
 * Second level of classification will be specific to domain in question
 * Only generic error kinds are listed
 * Conceptually, it conforms to HTTP standard for error codes
 * https://datatracker.ietf.org/doc/html/rfc7231#section-6.5
 * @readonly
 * @enum {String}
 */
const GQLErrorCode = {
    INTERNAL_ERROR,     // ??
    UNAUTHENTICATED,    // Need to authenticate or something wrong with token!
    FORBIDDEN,          // Don't have an access (maybe need to logIn or reLogIn user)
    BAD_USER_INPUT,     // Need to process by user form!
    TOO_MANY_REQUESTS,  // Need to process by user client to wait some time!
    PAYLOAD_TOO_LARGE,
}

// This error type is specifically used to indicate that during the execution of a GraphQL query,
// a nested GraphQL query was executed, and an error occurred within that nested query.
// It helps to differentiate between errors that occur at the top level and those that arise from
// deeper, nested queries, providing better context for debugging and error handling.
const SUB_GQL_ERROR = 'SUB_GQL_ERROR'

/**
 * Some reserve types for INTERNAL_ERROR codes
 * @readonly
 * @enum {String}
 */
const GQLInternalErrorTypes = {
    SUB_GQL_ERROR,
}

module.exports = {
    GQLErrorCode,
    GQLInternalErrorTypes,
}
