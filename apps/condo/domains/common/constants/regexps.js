const ALPHANUMERIC_REGEXP = /^[a-zA-Z0-9_]+$/
const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const PHONE = /^\+?\d*(\.\d*)?$/
const PHONE_CLEAR_REGEXP = /[^+0-9]/g

// ESCAPES SPECIAL REGEX CHARACTERS OF STRING TO ENABLE ITS USAGE INSIDE REGEX
const ESCAPE_REGEX = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')
}


module.exports = {
    ALPHANUMERIC_REGEXP,
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    PHONE,
    PHONE_CLEAR_REGEXP,
    ESCAPE_REGEX,
}
