const SPACE_SYMBOLS = ' \t\n\r\v\u00A0'
const SPACE_SYMBOL_LABLES = {
    ' ': ' ',
    '\t': '\\t',
    '\n': '\\n',
    '\r': '\\r',
    '\v': '\\v',
    '\u00A0': '\\u00A0 (&nbsp;)',
}
// eslint-disable-next-line no-useless-escape
const ESCAPABLE_SYMBOLS = `-[]{}()*+?.,\\/^$|#${SPACE_SYMBOLS}`
const ESCAPABLE_SYMBOLS_REGEX = /[-[\]{}()*+?.,\\/^$|#\s]/g
const ESCAPE_WITH = '\\$&'

// ESCAPES SPECIAL REGEX CHARACTERS OF STRING TO ENABLE ITS USAGE INSIDE REGEX
const getEscaped = (text) => String(text).replace(ESCAPABLE_SYMBOLS_REGEX, ESCAPE_WITH)

/**
 * Compares two strings, trimmed and lower cased according to locale
 * @param str1
 * @param str2
 * @param lang
 * @returns {boolean}
 */
const compareStrI = (str1, str2, lang = 'ru') => str1.trim().toLocaleLowerCase(lang) === str2.trim().toLocaleLowerCase(lang)


/**
 * Replaces {{ placeholders }} inside a template string using values from an object.
 * Supports nested keys, e.g. {{ user.phone }}.
 *
 * Example:
 *   interpolate("Call {{ user.phone }}", { user: { phone: "123" } })
 *   → "Call 123"
 * @param {string} template - The string containing placeholders in {{ key }} format.
 * @param {Object.<string, any>} values - An object containing replacement values.
 * @returns {string} - The template with replaced placeholders.
 */
function interpolate (template, values) {
    if (typeof template !== 'string') return null

    return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
        const value = key.split('.').reduce((obj, k) => (obj ? obj[k] : undefined), values)

        return value != null ? String(value) : ''
    })
}

module.exports = {
    getEscaped,
    ESCAPABLE_SYMBOLS,
    ESCAPABLE_SYMBOLS_REGEX,
    SPACE_SYMBOL_LABLES,
    SPACE_SYMBOLS,
    compareStrI,
    interpolate,
}