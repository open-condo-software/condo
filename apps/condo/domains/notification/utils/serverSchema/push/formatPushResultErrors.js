const { PushDeliveryError } = require('./PushDeliveryError')

function wrapError (error, wrappedErrors) {
    if (!(error instanceof Error) || error instanceof PushDeliveryError) return error
    if (!wrappedErrors.has(error)) {
        wrappedErrors.set(error, new PushDeliveryError(error))
    }
    return wrappedErrors.get(error)
}

// NOTE(YEgorLu): Wrap errors centrally after token validation, preserving provider errors for cleanup and formatting them for JSON persistence/logging.
function formatPushResultErrors (result) {
    const wrappedErrors = new Map()

    const formatted = { ...result }
    if (result.error !== undefined) formatted.error = wrapError(result.error, wrappedErrors)
    if (Array.isArray(result.responses)) {
        formatted.responses = result.responses.map(response => response.error === undefined
            ? response
            : { ...response, error: wrapError(response.error, wrappedErrors) })
    }
    return formatted
}

module.exports = { formatPushResultErrors }
