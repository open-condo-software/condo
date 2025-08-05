const util = require('util')

const { printError } = require('graphql')
const { pick, toArray, get, set, isArray, isEmpty, omitBy, isUndefined } = require('lodash')

const conf = require('@open-condo/config')

const { GQLErrorCode: { INTERNAL_ERROR }, GQLInternalErrorTypes: { SUB_GQL_ERROR } } = require('./constants')

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
    if (originalError && originalError?.data && !result.data) {
        result.data = originalError?.data
    }
}

function _handleKnexErrorCase (result, extensions, originalError) {
    // TODO(pahaz): it looks like we need to transform it to GQLError but in a future. Need to change code, type, ...
    extensions.message = originalError.message
}

function _handleGQLErrorCase (result, extensions, originalError) {
    // Propagate this error fields to extensions!
    result.name = 'GQLError'
    Object.assign(extensions, originalError.extensions)
}

function _updateExtensionsForKnownErrorCases (result, extensions, originalError) {
    // NOTE(pahaz): we want to extract messages from ValidationFailureError Keystone v5 error
    if (originalError?.name === 'ValidationFailureError') {
        _handleValidationErrorCase(result, extensions, originalError)
        return
    }

    // NOTE(pahaz): we want to extract internal knex error messages from violates constraint cases
    // TODO(pahaz): we need to hide sql queries!
    const hasDBUniqConstrain = originalError && originalError?.message?.includes('duplicate key value violates unique constraint')
    const hasDBCheckConstrain = originalError && originalError?.message?.includes('violates check constraint')
    if (hasDBUniqConstrain || hasDBCheckConstrain) {
        _handleKnexErrorCase(result, extensions, originalError)
        return
    }

    // NOTE(pahaz): we have an exact one parent originalError.errors, and it is GQLError
    const parentErrors = originalError?.errors
    const hasExactOneParentError = parentErrors && isArray(parentErrors) && parentErrors.length === 1
    if (hasExactOneParentError) {
        // Unwrap from GraphQLError or any other wrapper
        const internalError = (parentErrors[0]?.originalError) ? parentErrors[0]?.originalError : parentErrors[0]
        const internalErrorCName = internalError?.constructor?.name
        if (internalErrorCName === 'GQLError' && internalError.extensions) {
            _handleGQLErrorCase(result, extensions, internalError)
        }
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
    Object.assign(result, pick(error, (hideInternals) ? ['message', 'name'] : ['message', 'name', 'stack']))

    // [2] base request / error identifiers
    const ids = { reqId: error?.reqId, errId: error?.uid || error?.errId }
    Object.assign(result, ids)

    // [3] base graphql fields: locations, path
    //  - `locations` - array of { line, column } locations
    //  - `path` - array describing the JSON-path
    Object.assign(result, pick(error, ['locations', 'path']))

    // [4] graphql extensions field
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

    // [5] apollo/keystone error fields: time_thrown, data, internalData (it's old ApolloServer keys)
    Object.assign(result, pick(error, (hideInternals) ? ['data'] : ['data', 'time_thrown', 'internalData']))

    // [6] add messageForDeveloper field: if has (nodes) or has (source and location) => can use printError
    if (!_isRecursionCall && (error?.nodes || (error?.source && error?.location))) {
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
                } else {
                    _updateExtensionsForKnownErrorCases(result, extensions, internalError)
                }

                // NOTE(pahaz): propagate SUB_GQL_ERROR message to extensions
                //  if (we don't have extension.message || we have the same message for message and extension.message)
                //  then we want to propagate original message to improve developer experience
                if (internalError.message !== result.message && (!extensions.message || result.message === extensions.message)) {
                    extensions.message = internalError.message
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

        // NOTE(pahaz): KeystoneJS v5 data field from errors
        // TODO(pahaz): drop this undocumented backward compatibility ...
        if (originalError && originalError?.data && !result.data) {
            result.data = originalError.data
        }
    }

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

module.exports = {
    safeFormatError,
    safeApolloErrorFormatter,
    formatError,
}
