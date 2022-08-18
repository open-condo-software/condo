const ALPHANUMERIC_REGEXP = /^[a-zA-Z0-9_]+$/
const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const PHONE = /^\+?\d*(\.\d*)?$/
const PHONE_CLEAR_REGEXP = /[^+0-9]/g
const JAVASCRIPT_URL_XSS = /^[u00-u1F]*j[\r\n\t\s]*a[\r\n\t\s]*v[\r\n\t\s]*a[\r\n\t\s]*s[\r\n\t\s]*c[\r\n\t\s]*r[\r\n\t\s]*i[\r\n\t\s]*p[\r\n\t\s]*t[\r\n\t\s]*:/i
const QUERY_SPLIT_REGEX = /[\s.,]+/gm

module.exports = {
    ALPHANUMERIC_REGEXP,
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    PHONE,
    PHONE_CLEAR_REGEXP,
    JAVASCRIPT_URL_XSS,
    QUERY_SPLIT_REGEX,
}
