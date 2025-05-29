const { GQLErrorCode: { UNAUTHENTICATED } } = require('./constants')

const { GQLError } = require('../../errors')

// NEW GraphQL Error standard
function throwAuthenticationError (context) {
    throw new GQLError({
        name: 'AuthenticationError',
        code: UNAUTHENTICATED,
        message: 'No or incorrect authentication credentials',
    }, context)
}

module.exports = {
    throwAuthenticationError,
}
