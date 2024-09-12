const FORBIDDEN_SYMBOLS_IN_REQUEST_ID_REGEXP = /[^a-zA-Z0-9_/=+-]/g
const HEADERS_INJECTION_ERROR = 'Header contains prohibited characters'
const REQUEST_ID_VALIDATION_ERROR = 'RequestId contains prohibited characters'

const HEADER_VALIDATORS = {
    'x-request-id': validateRequestId,
    'x-start-request-id': validateRequestId,
    '*': checkHeaderForInjection,
}

function containsNewline (value) {
    return /[\r\n]/.test(value)
}

function checkHeaderForInjection (headerValue) {
    if (typeof headerValue === 'string') {
        if (containsNewline(headerValue)) {
            throw new Error(HEADERS_INJECTION_ERROR)
        }
        return
    }
    if (Array.isArray(headerValue)) {
        headerValue.forEach(checkHeaderForInjection)
        return
    }
    if (typeof headerValue === 'object' && headerValue !== null && !(headerValue instanceof Date)) {
        Object.values(headerValue).forEach(checkHeaderForInjection)
        return
    }
    if (headerValue && containsNewline(String(headerValue))) {
        throw new Error(HEADERS_INJECTION_ERROR)
    }
}

function validateRequestId (requestId) {
    if (FORBIDDEN_SYMBOLS_IN_REQUEST_ID_REGEXP.test(requestId)) {
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