/*
    What you need to know to understand what is going on here?

    Keystone.js is not so good to work with GraphQL errors.
    It use apollo-errors npm package for all their error.
    But the apollo-errors is not compatible with the common GraphQL spec.
    We need a way to fix it!

    1) you should read at least an example from GraphQL specification: http://spec.graphql.org/draft/#sec-Errors and https://github.com/graphql/graphql-js/blob/main/src/error/GraphQLError.ts
    2) you need to read the code from apollo-errors npm package: https://github.com/thebigredgeek/apollo-errors/blob/master/src/index.ts
    3) you need to look at: https://www.apollographql.com/docs/apollo-server/data/errors/ and https://github.com/apollographql/apollo-server/blob/apollo-server%402.23.0/packages/apollo-server-errors/src/index.ts
    4) you need to look at KeystoneJs source: https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/Keystone/format-error.js,
        https://github.com/keystonejs/keystone-5/blob/e12273f6e1ce1eaa1e7013f1feb1d158518c80c9/packages/keystone/lib/ListTypes/graphqlErrors.js, usage of `throwAccessDenied`, `ValidationFailureError` and `AccessDeniedError`.
        You should also check another KeystoneJs errors: LimitsExceededError and ParameterError

    We need to convert a KeystoneJS errors to friendly GraphQL format by using Apollo `formatError` function.

    Most important runtime client side errors:
     - UserInputError -- invalid value for a field argument (400)
     - AuthenticationError -- failed to authenticate (401)
     - ForbiddenError -- unauthorized to access (403)

 */

const util = require('util')

const { AuthenticationError } = require('apollo-server-errors')
const { printError } = require('graphql')
const { pick, toArray, toString, get, set, isArray, isEmpty, omitBy, isUndefined } = require('lodash')

const conf = require('@open-condo/config')

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

class NonError extends Error {
    constructor (message) {
        super(util.inspect(message))
        this.name = 'NonError'
        Error.captureStackTrace(this, NonError)
    }
}

function _ensureError (error) {
    if (!(error instanceof Error)) {
        return new NonError(error)
    }
    return error
}

/**
 * Use it if you need to safely prepare error for logging or ApolloServer result.
 * Call Cases:
 *   1) inside logging plugin to log errors
 *   2) inside apollo-server before { errors } rendering!
 * Format cases:
 *   1)
 *
 * To understand where this function called by ApolloServer look at this trace:
 *
 *       at ../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:287:28
 *           at Array.map (<anonymous>)
 *       at Object.formatApolloErrors (../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:285:25)
 *       at formatErrors (../../node_modules/apollo-server-core/src/requestPipeline.ts:665:12)
 *       at Object.<anonymous> (../../node_modules/apollo-server-core/src/requestPipeline.ts:482:34)
 *       at fulfilled (../../node_modules/apollo-server-core/dist/requestPipeline.js:5:58)
 *
 *  To understand where it also called:
 *
 *       at Object.safeFormatError [as didEncounterErrors] (../../packages/keystone/logging/GraphQLLoggerApp.js:94:70)
 *       at ../../node_modules/apollo-server-core/src/utils/dispatcher.ts:20:23
 *           at Array.map (<anonymous>)
 *       at Dispatcher.callTargets (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:17:20)
 *       at Dispatcher.<anonymous> (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:30:12)
 *       at ../../node_modules/apollo-server-core/dist/utils/dispatcher.js:8:71
 *       at Object.<anonymous>.__awaiter (../../node_modules/apollo-server-core/dist/utils/dispatcher.js:4:12)
 *       at Dispatcher.invokeHookAsync (../../node_modules/apollo-server-core/dist/utils/dispatcher.js:26:16)
 *       at ../../node_modules/apollo-server-core/src/requestPipeline.ts:631:29
 *       at ../../node_modules/apollo-server-core/dist/requestPipeline.js:8:71
 *       at Object.<anonymous>.__awaiter (../../node_modules/apollo-server-core/dist/requestPipeline.js:4:12)
 *       at didEncounterErrors (../../node_modules/apollo-server-core/dist/requestPipeline.js:286:20)
 *       at Object.<anonymous> (../../node_modules/apollo-server-core/src/requestPipeline.ts:477:17)
 *       at fulfilled (../../node_modules/apollo-server-core/dist/requestPipeline.js:5:58)
 *
 * @param {Error} error -- any error
 * @param {Boolean} hideInternals -- do you need to hide some internal error fields
 * @param {Boolean} applyPatches -- do you need to apply a common error message patches
 * @returns {import('graphql').GraphQLFormattedError}
 */
const safeFormatError = (errorIn, hideInternals = false, applyPatches = true) => {
    const error = _ensureError(errorIn)
    const extensions = {}
    const originalError = error?.originalError
    const result = {}

    // [1] base error fields
    const pickKeys1 = (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']
    Object.assign(result, pick(error, pickKeys1))

    // [2] base graphql fields:
    //  - locations - array of { line, column } locations
    //  - path - array describing the JSON-path
    //  - positions - array of character offsets within the source GraphQL document
    //  - nodes - array of GraphQL AST Nodes corresponding to this error
    //  - source - source GraphQL document corresponding to this error
    //  - extensions - fields to add to the formatted error
    //  - originalError - original error thrown from a field resolver during execution
    const pickKeys3 = ['locations', 'path']  // only this fields are visible
    Object.assign(result, pick(error, pickKeys3))
    const hasErrorExtensions = error.extensions && !isEmpty(error.extensions)
    const hasOriginalErrorExtensions = originalError && !isEmpty(originalError.extensions)
    if (hasErrorExtensions || hasOriginalErrorExtensions) {
        if (hasOriginalErrorExtensions) {
            Object.assign(extensions, originalError.extensions)
        }
        if (hasErrorExtensions) {
            Object.assign(extensions, error.extensions)
        }
        result.extensions = extensions
        // we already have more details inside originalError object and don't need this
        if (result.extensions.exception) delete result.extensions.exception
        if (result.extensions.name) delete result.extensions.name  // NODE: we don't have in at the moment!
        if (result.extensions.message && result.extensions.message === result.message) delete result.extensions.message
    }
    if (!hideInternals && originalError) {
        result.originalError = safeFormatError(originalError, hideInternals, false)
    }

    // [3] keystone fields: time_thrown, data, internalData (really it's old ApolloServer keys)
    const pickKeys2 = (hideInternals) ? ['data'] : ['data', 'time_thrown', 'internalData']
    Object.assign(result, pick(error, pickKeys2))

    // NOTE(pahaz): if has (nodes) or has (source and location) => can use printError
    if (error.nodes || (error.source && error.location)) {
        const messageForDeveloper = printError(error)
        extensions.messageForDeveloper = messageForDeveloper
        result.extensions = extensions
    }

    if (originalError) {
        // KeystoneJS hotfixes! Taken from KeystoneJS sources. Probably useless in a future but we already have a tests for that!
        if (originalError.name && originalError.name !== 'Error') {
            result.name = originalError.name
        }
    }

    // save error uid
    if (error && error.uid) {
        result.uid = toString(error.uid)
    }

    // nested errors support
    if (!hideInternals && error && error.errors) {
        const nestedErrors = toArray(error.errors).map((err) => safeFormatError(err, hideInternals, false))
        if (nestedErrors.length) result.errors = nestedErrors
    }

    if (applyPatches) _patchKnownErrorCases(error, result)

    return omitBy(result, isUndefined)
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