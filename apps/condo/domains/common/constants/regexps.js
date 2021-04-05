const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const PHONE = /^\+?\d*(\.\d*)?$/

module.exports = {
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    PHONE,
}
