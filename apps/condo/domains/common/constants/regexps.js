const ALPHANUMERIC_REGEXP = /^[a-zA-Z0-9_]+$/
const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const PHONE = /^\+?\d*(\.\d*)?$/
const PHONE_CLEAR_REGEXP = /[^+0-9]/g
const JAVASCRIPT_URL_XSS = /[u00-u1F]*j[\s]*a[\s]*v[\s]*a[\s]*s[\s]*c[\s]*r[\s]*i[\s]*p[\s]*t[\s]*:/i
const QUERY_SPLIT_REGEX = /[\s.,]+/gm
const SPECIAL_CHAR_REGEXP = /[^\p{L}\s-]/ui

module.exports = {
    ALPHANUMERIC_REGEXP,
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    PHONE,
    PHONE_CLEAR_REGEXP,
    JAVASCRIPT_URL_XSS,
    QUERY_SPLIT_REGEX,
    SPECIAL_CHAR_REGEXP,
}
