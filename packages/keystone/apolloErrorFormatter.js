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

    `formatError` call cases:
      1) inside logging plugin to log errors
      2) inside apollo-server before { errors } rendering!

    To understand where the `formatError` function called by ApolloServer look at this trace (1):

          at ../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:287:28
              at Array.map (<anonymous>)
          at Object.formatApolloErrors (../../node_modules/apollo-server-core/node_modules/apollo-server-errors/src/index.ts:285:25)
          at formatErrors (../../node_modules/apollo-server-core/src/requestPipeline.ts:665:12)
          at Object.<anonymous> (../../node_modules/apollo-server-core/src/requestPipeline.ts:482:34)
          at fulfilled (../../node_modules/apollo-server-core/dist/requestPipeline.js:5:58)

     To understand where the `formatError` is also called (2):

          at Object.safeFormatError [as didEncounterErrors] (../../packages/keystone/logging/GraphQLLoggerApp.js:94:70)
          at ../../node_modules/apollo-server-core/src/utils/dispatcher.ts:20:23
              at Array.map (<anonymous>)
          at Dispatcher.callTargets (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:17:20)
          at Dispatcher.<anonymous> (../../node_modules/apollo-server-core/src/utils/dispatcher.ts:30:12)
          at ../../node_modules/apollo-server-core/dist/utils/dispatcher.js:8:71
          at Object.<anonymous>.__awaiter (../../node_modules/apollo-server-core/dist/utils/dispatcher.js:4:12)
          at Dispatcher.invokeHookAsync (../../node_modules/apollo-server-core/dist/utils/dispatcher.js:26:16)
          at ../../node_modules/apollo-server-core/src/requestPipeline.ts:631:29
          at ../../node_modules/apollo-server-core/dist/requestPipeline.js:8:71
          at Object.<anonymous>.__awaiter (../../node_modules/apollo-server-core/dist/requestPipeline.js:4:12)
          at didEncounterErrors (../../node_modules/apollo-server-core/dist/requestPipeline.js:286:20)
          at Object.<anonymous> (../../node_modules/apollo-server-core/src/requestPipeline.ts:477:17)
          at fulfilled (../../node_modules/apollo-server-core/dist/requestPipeline.js:5:58)
 */

const util = require('util')

const { printError } = require('graphql')
const { pick, toArray, get, set, isArray, isEmpty, omitBy, isUndefined } = require('lodash')

const conf = require('@open-condo/config')

const { GQLError, GQLErrorCode: { INTERNAL_ERROR, UNAUTHENTICATED }, GQLInternalErrorTypes: { SUB_GQL_ERROR } } = require('./errors')

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
 * Internal error class for cases when someone trying to call safeFormatError(err) with non an error type argument.
 * Inspired by npm ensure-error package.
 * @private
 */
class NonError extends Error {
    constructor (message) {
        super(util.inspect(message))
        this.name = 'NonError'
        Error.captureStackTrace(this, NonError)
    }
}

/**
 * Hardcoded simplified version of https://github.com/sindresorhus/ensure-error/blob/01864b2c3b1857e59052736ece4ce0958593fc35/index.js
 * NPM [ensure-error](https://www.npmjs.com/package/ensure-error) package
 * @param error {Error|any}
 * @returns {Error}
 * @private
 */
function _ensureError (error) {
    if (!(error instanceof Error)) {
        return new NonError(error)
    }
    return error
}

function _buildCombinedStacks (stack, errors) {
    if (!errors || !isArray(errors)) return stack
    const result = (stack) ? [stack] : []
    const length = errors.length
    errors.forEach((err, index) => {
        const prefix = (length === 1) ? '^- Caused By: ' : `^- Caused By many errors [${index + 1}/${length}]: `
        const error = (err.originalError) ? err.originalError : err
        result.push(prefix + error.stack)
        if (isArray(error.errors)) {
            // NOTE(pahaz): keystone has some wrapper with parent .errors array and we also can throw nested error. Lets support it
            // TODO(pahaz): what about cycle recursion?
            const nested = _buildCombinedStacks(undefined, error.errors)
            result.push(nested)
        }
    })
    return result.join('\n')
}

function _fullstack (err) {
    if (!err) return '<undefined>'
    const error = err?.originalError || err
    return _buildCombinedStacks(error.stack, error.errors)
}

function _handleValidationErrorCase (result, extensions, originalError) {
    // TODO(pahaz): it looks like we need to transform it to GQLError but in a future. Need to change code, type, ...
    const messages = originalError?.data?.messages
    if (messages && isArray(messages) && messages.length > 0) {
        extensions.message = messages.join(';\n')
    }
    // TODO(pahaz): drop this undocumented backward compatibility ...
    const data = originalError?.data
    if (data) {
        result.data = data
    }
}

function _handleKnexError (result, extensions, originalError) {
    // TODO(pahaz): it looks like we need to transform it to GQLError but in a future. Need to change code, type, ...
    extensions.message = originalError.message
}

function _updateExtensionsForKnownErrorCases (result, extensions, originalError) {
    // NOTE(pahaz): we want to extract messages from ValidationFailureError Keystone v5 error
    if (originalError?.name === 'ValidationFailureError') {
        _handleValidationErrorCase(result, extensions, originalError)
        return
    }

    // NOTE(pahaz): we want to extract internal knex error messages from violates constraint cases
    const hasDBUniqConstrain = originalError && originalError?.message?.includes('duplicate key value violates unique constraint')
    const hasDBCheckConstrain = originalError && originalError?.message?.includes('violates check constraint')
    if (hasDBUniqConstrain || hasDBCheckConstrain) {
        _handleKnexError(result, extensions, originalError)
        return
    }
}

function _safeFormatErrorRecursion (errorIn, hideInternals = false, applyPatches = true, _isRecursionCall = false) {
    const error = _ensureError(errorIn)
    const errorCName = error?.constructor?.name
    const extensions = {}
    const originalError = error?.originalError
    const originalErrorCName = originalError?.constructor?.name
    const result = {}

    // [1] base error fields: name, message, stack
    const pickKeys1 = (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']
    Object.assign(result, pick(error, pickKeys1))

    // [2] base graphql fields: locations, path
    //  - `locations` - array of { line, column } locations
    //  - `path` - array describing the JSON-path
    const pickKeys3 = ['locations', 'path']
    Object.assign(result, pick(error, pickKeys3))

    // [3] graphql extensions field
    const hasErrorExtensions = error.extensions && !isEmpty(error.extensions)
    const hasOriginalErrorExtensions = originalError && !isEmpty(originalError.extensions)
    if (hasErrorExtensions || hasOriginalErrorExtensions) {
        if (hasErrorExtensions) {
            Object.assign(extensions, error.extensions)
        }
        if (hasOriginalErrorExtensions) {
            Object.assign(extensions, originalError.extensions)
        }
    }

    // [4] apollo/keystone error fields: time_thrown, data, internalData (it's old ApolloServer keys)
    const pickKeys2 = (hideInternals) ? ['data'] : ['data', 'time_thrown', 'internalData']
    Object.assign(result, pick(error, pickKeys2))

    // [5] add messageForDeveloper field: if has (nodes) or has (source and location) => can use printError
    if (!_isRecursionCall && (error.nodes || (error.source && error.location))) {
        const messageForDeveloper = printError(error)
        if (messageForDeveloper !== error.message) {
            extensions.messageForDeveloper = messageForDeveloper
        }
    }

    // NOTE(pahaz): ApolloServer wraps all errors by GraphQLError. We want to change the results based on the wrapped error
    // It's backward API compatibility fixes. Really you should always use `GQLError` but at the moment we have some old throw error code.
    if (!_isRecursionCall && errorCName === 'GraphQLError') {
        // NOTE(pahaz): We want to replace the current error if we determine that we received a GQLError.
        // For example, when implementing the logic for GQLCustomSchema, if a call to User.create() occurs during the execution of a query
        // which triggers a GQLError validation error, we want to pass this error up in the response so that it is visible to the user.
        if (originalErrorCName === 'GQLError') {
            const code = originalError?.extensions?.code
            const type = originalError?.extensions?.type
            const parentErrors = originalError?.errors
            // We have an exact one parent gqlError.errors, and it is GQLError({ code: INTERNAL_ERROR, type: SUB_GQL_ERROR })
            if (code === INTERNAL_ERROR && type === SUB_GQL_ERROR && isArray(parentErrors) && parentErrors.length === 1) {
                // Unwrap from GraphQLError or any other wrapper
                const internalError = (parentErrors[0]?.originalError) ? parentErrors[0]?.originalError : parentErrors[0]
                const internalErrorCName = internalError?.constructor?.name
                // If we found internal GQLError error
                if (internalErrorCName === 'GQLError' && internalError.extensions) {
                    // Propagate this error fields to extensions!
                    Object.assign(extensions, internalError.extensions)
                } else if (internalErrorCName === 'Error' && internalError?.errors) {
                    // Keystone wrapper (new Error).errors case
                    const keystoneLikeErrors = internalError?.errors
                    if (keystoneLikeErrors && isArray(keystoneLikeErrors) && keystoneLikeErrors.length === 1) {
                        const internalKeystoneError = (keystoneLikeErrors[0]?.originalError) ? keystoneLikeErrors[0]?.originalError : keystoneLikeErrors[0]
                        const internalKeystoneErrorCName = internalKeystoneError?.constructor?.name
                        if (internalKeystoneErrorCName === 'GQLError' && internalKeystoneError.extensions) {
                            Object.assign(extensions, internalKeystoneError.extensions)
                        }
                    }
                } else {
                    _updateExtensionsForKnownErrorCases(result, extensions, internalError)
                }
            }
        }

        _updateExtensionsForKnownErrorCases(result, extensions, originalError)

        // NOTE(pahaz): KeystoneJS v5 compatibility! We already have lots of test with that names.
        // We need to use more specific name instead of the 'GraphQLError'.
        // If you want to change it you probably want to change API compatibility.
        if (originalError && originalError?.name?.toLowerCase() !== 'error') {
            result.name = originalError.name
        }
    }

    // TODO(pahaz): think about errId / uid and add it here

    // fullstack error
    if (!_isRecursionCall && !hideInternals) {
        // NOTE(pahaz): we want to restore a fullstack if any GQLError thrown
        const fullstack = _fullstack(error)
        if (fullstack !== error['stack']) result['fullstack'] = fullstack
    }

    // nested errors support
    if (!hideInternals && error.errors) {
        const nestedErrors = toArray(error.errors).map((err) => _safeFormatErrorRecursion(err, hideInternals, false, true))
        if (nestedErrors.length) result.errors = nestedErrors
    }

    // nested originalError support
    if (!hideInternals && originalError) {
        result.originalError = _safeFormatErrorRecursion(originalError, hideInternals, false, true)
    }

    if (!isEmpty(extensions)) {
        result.extensions = extensions
        // we already have more details inside originalError object and don't need this
        if (result.extensions.exception) delete result.extensions.exception
        if (result.extensions.name) delete result.extensions.name
        if (result.extensions.context) delete result.extensions.context
    }

    if (applyPatches) _patchKnownErrorCases(error, result)

    return omitBy(result, isUndefined)
}

/**
 * Use it if you need to safely prepare error for logging or ApolloServer result.
 * @param {Error} error -- any error
 * @param {Boolean} hideInternals -- do you need to hide some internal error fields
 * @param {Boolean} applyPatches -- do you need to apply a common error message patches
 * @returns {import('graphql').GraphQLFormattedError}
 */
function safeFormatError (error, hideInternals = false, applyPatches = true) {
    return _safeFormatErrorRecursion(error, hideInternals, applyPatches)
}

/**
 * `ApolloServer.formatError` function. If you want to use it in any other place please use `safeFormatError`
 * @param {import('graphql').GraphQLError} error - any apollo server caught error
 * @returns {import('graphql').GraphQLFormattedError}
 */
function safeApolloErrorFormatter (error) {
    return safeFormatError(error, IS_HIDE_INTERNALS, true)
}

/**
 * @deprecated use `safeApolloErrorFormatter` instead it's some legacy name!
 * @param error {import('graphql').GraphQLError}
 * @returns {import('graphql').GraphQLFormattedError}
 */
function formatError (error) {
    return safeApolloErrorFormatter(error)
}

// NEW GraphQL Error standard

function throwAuthenticationError (context) {
    throw new GQLError({
        name: 'AuthenticationError',
        code: UNAUTHENTICATED,
        message: 'No or incorrect authentication credentials',
    }, context)
}

module.exports = {
    safeFormatError,
    safeApolloErrorFormatter,
    formatError,
    throwAuthenticationError,
}
