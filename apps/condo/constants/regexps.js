const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const NUMBERS_AND_PLUS = /^\+?\d*(\.\d*)?$/

module.exports = {
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    NUMBERS_AND_PLUS,
}
