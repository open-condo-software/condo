/*
    What you need to know to understand what is going on here?

    Keystone.js is not so good to work with GraphQL errors.
    It use apollo-errors npm package for all their error.
    But the apollo-errors is not compatible with the common GraphQL spec.
    We need a way to fix it!

    1) you should read at leas an examples from GraphQL specification: http://spec.graphql.org/draft/#sec-Errors
    2) you need to read the code from apollo-errors npm package: https://github.com/thebigredgeek/apollo-errors/blob/master/src/index.ts
    3) you need to look at: https://www.apollographql.com/docs/apollo-server/data/errors/ and https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-errors/src/index.ts
    4) you need to look at KeystonJs source: /node_modules/@keystonejs/keystone/lib/Keystone/format-error.js,
        /node_modules/@keystonejs/keystone/lib/ListTypes/graphqlErrors.js, usage of `throwAccessDenied`, `ValidationFailureError` and `AccessDeniedError`.
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
const { ApolloError } = require('apollo-server-errors')
const ensureError = require('ensure-error')
const { serializeError } = require('serialize-error')
const cuid = require('cuid')
const { pick, toArray, _, toString, isObject } = require('lodash')

const { graphqlLogger } = require('@keystonejs/keystone/lib/Keystone/logger')

const conf = require('@core/config')

const IS_HIDE_INTERNALS = conf.NODE_ENV === 'production'

const safeFormatError = (error, hideInternals = false) => {
    // error keyst: message, name, stack
    const pickKeys1 = (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']
    const result = pick(serializeError(error), pickKeys1)

    // keystoneError keys: time_thrown, message, data, locations, path
    if (isKeystoneErrorInstance(error)) {
        const pickKeys2 = (hideInternals) ? ['time_thrown', 'data'] : ['data', 'internalData', 'time_thrown', 'locations', 'path']
        Object.assign(result, pick(error, pickKeys2))
    }

    // apolloError keys: path, extensions, locations, source, positions, nodes, originalError
    if (error instanceof ApolloError) {
        const pickKeys3 = (hideInternals) ? ['path', 'locations'] : ['path', 'locations', 'source', 'positions', 'nodes']
        Object.assign(result, pick(error, pickKeys3))
    }

    if (!hideInternals && error.extensions && isObject(error.extensions)) {
        result.extensions = _(error.extensions).toJSON()
        if (error.extensions.exception) {
            result.extensions.exception = safeFormatError(error.extensions.exception, hideInternals)
        }
    }

    if (!hideInternals && error.originalError) {
        result.originalError = safeFormatError(error.originalError, hideInternals)
    }

    if (error.uid) {
        result.uid = toString(error.uid)
    }

    // nested error!
    if (error.errors) {
        const nestedErrors = toArray(error.errors).map((err) => safeFormatError(err, hideInternals))
        if (nestedErrors.length) result.errors = nestedErrors
    }

    return result
}

const formatError = error => {
    // error: { locations, path, message, extensions }
    const { originalError } = error

    try {
        // For correlating user error reports with logs
        error.uid = cuid()

        // NOTE1(pahaz): Keystone use apollo-errors for all their errors. There are:
        //   AccessDeniedError, ValidationFailureError, LimitsExceededError and ParameterError
        // NOTE2(pahaz): Apollo use apollo-server-errors for all their errors> There are:
        //   SyntaxError, ValidationError, UserInputError, AuthenticationError, ForbiddenError, PersistedQueryNotFoundError, PersistedQueryNotSupportedError, ...
        if (isKeystoneErrorInstance(originalError) || originalError instanceof ApolloError) {
            // originalError: { message name data internalData time_thrown path locations }
            graphqlLogger.info({
                type: 'error',
                ...safeFormatError(error),
            })
        } else {
            graphqlLogger.error({
                type: 'error',
                ...safeFormatError(error),
            })
        }
    } catch (formatErrorError) {
        // Something went wrong with formatting above, so we log the errors
        graphqlLogger.error(serializeError(ensureError(error)))
        graphqlLogger.error(serializeError(ensureError(formatErrorError)))
    }

    return safeFormatError(error, IS_HIDE_INTERNALS)
}

module.exports = {
    safeFormatError,
    formatError,
}
