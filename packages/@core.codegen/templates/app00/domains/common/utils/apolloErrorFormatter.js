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
const { pick, pickBy, identity, toArray, _, toString, get, set, isArray } = require('lodash')

const conf = require('@core/config')

const IS_HIDE_INTERNALS = conf.NODE_ENV === 'production'
const COMMON_ERROR_CASES = {}

function _getAllErrorMessages (error) {
    const messages = []
    const m1 = get(error, 'message')
    if (m1) messages.push(m1)
    const m2 = get(error, 'originalError.message')
    if (m2) messages.push(m2)

    if (isArray(get(error, 'errors'))) {
        for (const x of error.errors) {
            const m = get(x, 'message')
            if (m) messages.push(m)
        }
    }
    if (isArray(get(error, 'originalError.errors'))) {
        for (const x of error.originalError.errors) {
            const m = get(x, 'message')
            if (m) messages.push(m)
        }
    }
    return messages
}

function _patchKnownErrorCases (error, result) {
    const message = _getAllErrorMessages(error).join(' -- ')
    for (const key in COMMON_ERROR_CASES) {
        if (message.includes(key)) {
            const patch = COMMON_ERROR_CASES[key]
            for (const patchKey in patch) {
                set(result, patchKey, patch[patchKey])
            }
        }
    }
}

/**
 * Use it if you need to safely prepare error for logging or ApolloServer result
 * @param {Error} error -- any error
 * @param {Boolean} hideInternals -- do you need to hide some internal error fields
 * @param {Boolean} applyPatches -- do you need to apply a common error message patches
 * @returns {import('graphql').GraphQLFormattedError}
 */
const safeFormatError = (error, hideInternals = false, applyPatches = true) => {
    const result = {}

    // error keyst: message, name, stack
    const pickKeys1 = (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']
    Object.assign(result, pick(ensureError(error), pickKeys1))

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
        result.originalError = safeFormatError(error.originalError, hideInternals, false)
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
        const nestedErrors = toArray(error.errors).map((err) => safeFormatError(err, hideInternals, false))
        if (nestedErrors.length) result.errors = nestedErrors
    }

    if (applyPatches) _patchKnownErrorCases(error, result)

    return result
}

/**
 * ApolloServer.formatError function
 * @param {import('graphql').GraphQLError} error - any apollo server catched error
 * @returns {import('graphql').GraphQLFormattedError}
 */
const formatError = error => {
    return safeFormatError(error, IS_HIDE_INTERNALS, true)
}

// NEW GraphQL Error standard

function throwAuthenticationError () {
    throw new AuthenticationError('No or incorrect authentication credentials')
}

module.exports = {
    safeFormatError,
    formatError,
    throwAuthenticationError,
}
