const conf = require('@open-condo/config')

const SENSITIVE_KEY_REGEX = /(password|phone|secret|token|receipt)/i

function normalizeQuery (string) {
    if (!string) return ''
    // NOTE(pahaz): https://spec.graphql.org/June2018/#sec-Insignificant-Commas
    //   Similar to white space and line terminators, commas (,) are used to improve the legibility of source text
    return string.replace(/[\s,]+/g, ' ').trim()
}

function getOverrideKeys () {
    const keys = conf['LOG_SENSITIVE_KEYS_OVERRIDE']
    if (!keys) return []

    return keys
        .toLowerCase()
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)
}

function isSensitiveKey (key) {
    if (!SENSITIVE_KEY_REGEX.test(key)) return false
    return !getOverrideKeys().includes(key.toLowerCase())
}

function redactSensitiveValues (value) {
    if (Array.isArray(value)) {
        return value.map(redactSensitiveValues)
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value)
        return entries.reduce((acc, [key, entryValue]) => {
            acc[key] = isSensitiveKey(key) ? '***' : redactSensitiveValues(entryValue)
            return acc
        }, {})
    }

    return value
}

function normalizeVariables (object) {
    if (!object) return undefined
    const data = JSON.parse(JSON.stringify(object))
    const redacted = redactSensitiveValues(data)
    return JSON.stringify(redacted)
}

module.exports = {
    normalizeQuery,
    normalizeVariables,
}
