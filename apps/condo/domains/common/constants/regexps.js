const ALPHANUMERIC_REGEXP = /^[a-zA-Z0-9_]+$/
const UPPER_CASE_ALPHANUMERIC_REGEXP = /^[A-Z0-9_]+$/
const LETTERS_AND_NUMBERS = /[\p{L}\p{N}]/gu
const PHONE = /^\+?\d*(\.\d*)?$/
const PHONE_CLEAR_REGEXP = /[^+0-9]/g
const JAVASCRIPT_URL_XSS = /[u00-u1F]*j[\s]*a[\s]*v[\s]*a[\s]*s[\s]*c[\s]*r[\s]*i[\s]*p[\s]*t[\s]*:/i
const QUERY_SPLIT_REGEX = /[\s.,]+/gm
const SPECIAL_CHAR_REGEXP = /[^\p{L}\s-]/ui
const LINEAR_GRADIENT_REGEXP = /^linear-gradient\([^(]*(\([^)]*\)[^(]*)*[^)]*\)$/
const HEX_CODE_REGEXP = /^#(([0-9a-f]){3}){1,2}$/i
const TWO_OR_MORE_SPACES_REGEXP = /\s\s+/g
const OMIT_SEARCH_CHARACTERS_REGEXP = /[^\p{Alphabetic}\p{Decimal_Number}\s/]/igu
const MULTIPLE_EMAILS_REGEX = /^[\w+.-]+@[a-z\d.-]+\.[a-z]{2,}(\s*,\s*[\w+.-]+@[a-z\d.-]+\.[a-z]{2,})*$/i
const UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ROLE_PERMISSION_REGEX = /^can(?:[A-Z][a-z]*)+$/
const EMAIL_REGEX = new RegExp(/\S+@\S+\.\S+/, 'gm')
const URL_REGEX = new RegExp('(https?:\\/\\/(?:www\\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\\.[^\\s]{2,}|www\\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\\.[^\\s]{2,}|https?:\\/\\/(?:www\\.|(?!www))[a-zA-Z0-9]+\\.[^\\s]{2,}|www\\.[a-zA-Z0-9]+\\.[^\\s]{2,})', 'gm')
const URL_WITH_CYRILLIC_REGEX = new RegExp('(https?:\\/\\/(?:www\\.|(?!www))[a-zа-я0-9][a-zа-я0-9-]+[a-zа-я0-9]\\.[^\\s]{2,}|www\\.[a-zа-я0-9][a-zа-я0-9-]+[a-zа-я0-9]\\.[^\\s]{2,}|https?:\\/\\/(?:www\\.|(?!www))[a-zа-я0-9]+\\.[^\\s]{2,}|www\\.[a-zа-я0-9]+\\.[^\\s]{2,})', 'gmi')
const IPv4_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
const NOT_NUMBER_REGEX = /\D/g

module.exports = {
    ALPHANUMERIC_REGEXP,
    UPPER_CASE_ALPHANUMERIC_REGEXP,
    LETTERS_AND_NUMBERS,
    PHONE,
    PHONE_CLEAR_REGEXP,
    JAVASCRIPT_URL_XSS,
    QUERY_SPLIT_REGEX,
    SPECIAL_CHAR_REGEXP,
    LINEAR_GRADIENT_REGEXP,
    HEX_CODE_REGEXP,
    TWO_OR_MORE_SPACES_REGEXP,
    OMIT_SEARCH_CHARACTERS_REGEXP,
    MULTIPLE_EMAILS_REGEX,
    UUID_REGEXP,
    ROLE_PERMISSION_REGEX,
    EMAIL_REGEX,
    URL_REGEX,
    URL_WITH_CYRILLIC_REGEX,
    IPv4_REGEX,
    NOT_NUMBER_REGEX,
}
