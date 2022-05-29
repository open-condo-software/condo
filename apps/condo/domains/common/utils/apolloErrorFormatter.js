/*
    What you need to know to understand what is going on here?

    Keystone.js is not so good to work with GraphQL errors.
    It use apollo-errors npm package for all their error.
    But the apollo-errors is not compatible with the common GraphQL spec.
    We need a way to fix it!

    1) you should read at least an example from GraphQL specification: http://spec.graphql.org/draft/#sec-Errors and https://github.com/graphql/graphql-js/blob/main/src/error/GraphQLError.ts
    2) you need to read the code from apollo-errors npm package: https://github.com/thebigredgeek/apollo-errors/blob/master/src/index.ts
    3) you need to look at: https://www.apollographql.com/docs/apollo-server/data/errors/ and https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-errors/src/index.ts
    4) you need to look at KeystoneJs source: https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/Keystone/format-error.js,
        https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/ListTypes/graphqlErrors.js, usage of `throwAccessDenied`, `ValidationFailureError` and `AccessDeniedError`.
        You should also check another KeystoneJs errors: LimitsExceededError and ParameterError

    We need to convert a KeystoneJS errors to friendly GraphQL format by using Apollo `formatError` function.

    Most important runtime client side errors:
     - UserInputError -- invalid value for a field argument (400)
     - AuthenticationError -- failed to authenticate (401)
     - ForbiddenError -- unauthorized to access (403)

 */

const {
    isInstance: isKeystoneErrorInstance,
} = require('apollo-errors')
const { ApolloError, AuthenticationError } = require('apollo-server-errors')
const { GraphQLError, printError } = require('graphql')

const ensureError = require('ensure-error')
const { serializeError } = require('serialize-error')
const cuid = require('cuid')
const { pick, pickBy, identity, toArray, _, toString, get } = require('lodash')

const { graphqlLogger } = require('@keystonejs/keystone/lib/Keystone/logger')

const conf = require('@core/config')

const IS_HIDE_INTERNALS = conf.NODE_ENV === 'production'

const safeFormatError = (error, hideInternals = false) => {
    const result = {}

    // error keyst: message, name, stack
    const pickKeys1 = (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']
    Object.assign(result, pick(error, pickKeys1))

    // keystoneError keys: time_thrown, message, data, internalData, locations, path
    if (isKeystoneErrorInstance(error)) {
        const pickKeys2 = (hideInternals) ? ['time_thrown', 'data', 'locations', 'path'] : ['time_thrown', 'data', 'locations', 'path', 'internalData']
        Object.assign(result, pick(error, pickKeys2))
    }

    // apolloError keys: path, locations, source, positions, nodes, extensions, originalError
    //  + 'locations', 'positions', 'source', 'nodes' -- used for printError() in human readable format!
    //  + 'path' -- GraphQL query path with aliases
    //  + 'extensions' -- some extra context
    //  + 'originalError' -- original Error instance
    if (error instanceof ApolloError || error instanceof GraphQLError) {
        const pickKeys3 = ['path', 'locations']
        Object.assign(result, pickBy(pick(error, pickKeys3), identity))
        const developerErrorMessage = printError(error)
        if (developerErrorMessage !== result.message) {
            // we want to show a developer friendly message
            result.developerMessage = printError(error)
        }
        if (error.extensions) {
            result.extensions = _(error.extensions).toJSON()
            // we already have more details inside originalError object and don't need this
            if (result.extensions.exception) delete result.extensions.exception
        }
    }

    if (!hideInternals && error.originalError) {
        result.originalError = safeFormatError(error.originalError, hideInternals)
    }

    // KeystoneJS hotfixes! Taken from KeystoneJS sources. Probably useless in a future but we already have a tests for that!
    if (error.originalError) {
        if (error.originalError.path && !result.path) {
            result.path = error.originalError.path
        }
        if (isKeystoneErrorInstance(error.originalError)) {
            result.name = error.originalError.name
            result.data = error.originalError.data
        } else if (error.originalError instanceof ApolloError) {
            result.name = error.originalError.name
        }
    }

    // save error uid
    if (error.uid) {
        result.uid = toString(error.uid)
    }

    // nested errors support
    if (error.errors) {
        const nestedErrors = toArray(error.errors).map((err) => safeFormatError(err, hideInternals))
        if (nestedErrors.length) result.errors = nestedErrors
    }

    return result
}

const toGraphQLFormat = (safeFormattedError) => {
    const result = {
        message: safeFormattedError.message || 'no message',
        extensions: {
            ...safeFormattedError,
            ...(safeFormattedError.extensions ? safeFormattedError.extensions : {}),
        },
        path: safeFormattedError.path || null,
        locations: safeFormattedError.locations || null,
    }
    delete result.extensions.extensions
    delete result.extensions.path
    delete result.extensions.locations
    delete result.extensions.message
    return result
}

const formatError = error => {
    // error: { locations, path, message, extensions }
    const { originalError } = error
    const reqId = get(error, 'reqId')

    try {
        // For correlating user error reports with logs
        if (!error.uid) error.uid = cuid()

        // NOTE1(pahaz): Keystone use apollo-errors for all their errors. There are:
        //   AccessDeniedError, ValidationFailureError, LimitsExceededError and ParameterError
        // NOTE2(pahaz): Apollo use apollo-server-errors for all their errors> There are:
        //   SyntaxError, ValidationError, UserInputError, AuthenticationError, ForbiddenError, PersistedQueryNotFoundError, PersistedQueryNotSupportedError, ...
        if (isKeystoneErrorInstance(originalError) || originalError instanceof ApolloError) {
            // originalError: { message name data internalData time_thrown path locations }
            graphqlLogger.info({ reqId, apolloFormatError: safeFormatError(error) })
        } else {
            graphqlLogger.error({ reqId, apolloFormatError: safeFormatError(error) })
        }
    } catch (formatErrorError) {
        // Something went wrong with formatting above, so we log the errors
        graphqlLogger.error({ reqId, error: serializeError(ensureError(error)) })
        graphqlLogger.error({ reqId, error: serializeError(ensureError(formatErrorError)) })
    }

    return safeFormatError(error, IS_HIDE_INTERNALS)
}

// NEW GraphQL Error standard

function throwAuthenticationError () {
    throw new AuthenticationError('No or incorrect authentication credentials')
}

module.exports = {
    safeFormatError,
    toGraphQLFormat,
    formatError,
    throwAuthenticationError,
}
