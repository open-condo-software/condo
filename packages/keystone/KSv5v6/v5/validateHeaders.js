const SYMBOLS_TO_CLEAR_FROM_REQUEST_ID_REGEXP = /[^a-zA-Z0-9_/=+-]/g
const HEADERS_INJECTION_ERROR = 'Header contains prohibited characters'
const REQUEST_ID_VALIDATION_ERROR = 'RequestId from headers contains prohibited characters'

const HEADER_VALIDATORS = {
    'x-request-id': validateRequestId,
    'x-start-request-id': validateRequestId,
    '*': checkHeaderForInjection,
}

function containsNewline (value) {
    return /[\r\n]/.test(value)
}

function checkHeaderForInjection (value) {
    if (typeof value === 'string') {
        if (containsNewline(value)) {
            throw new Error(HEADERS_INJECTION_ERROR)
        }
        return
    }
    if (Array.isArray(value)) {
        value.forEach((item) => checkHeaderForInjection(item))
        return
    }
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        Object.entries(value).forEach(([, val]) =>
            checkHeaderForInjection(val)
        )
        return
    }
    if (value !== null && containsNewline(String(value))) {
        throw new Error(HEADERS_INJECTION_ERROR)
    }
}

function validateRequestId (requestId) {
    if (SYMBOLS_TO_CLEAR_FROM_REQUEST_ID_REGEXP.test(requestId)) {
        throw new Error(REQUEST_ID_VALIDATION_ERROR)
    }
}

function validateHeaders (headers) {
    for (const header in headers) {
        const validator = HEADER_VALIDATORS.hasOwnProperty(header) ? HEADER_VALIDATORS[header] : HEADER_VALIDATORS['*']
        validator(headers[header])
    }
}

module.exports = {
    validateHeaders,
    HEADERS_INJECTION_ERROR,
    REQUEST_ID_VALIDATION_ERROR,
}