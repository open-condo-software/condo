const BAD_WORDS_EXCLUSIONS = ['ипу']

const SPECIAL_CHARS = /\d|[!@#$%^&*()[\];:'",.?\-_=+~`|]|a|(?:the)|(?:el)|(?:la)/

/**
 * Create regular expression by dictionary expression string
 * (This is a small function from the implementation of "bad-words-next")
 *
 * @param {string} expr
 * @return {RegExp}
 */
const getRegexWithSpecChars = (expr) => {
    // "bad-words-next" may be return bad words with special chars
    const specialChars = SPECIAL_CHARS.toString().slice(1, -1)
    // not an user input. No ReDoS regexp expected
    // nosemreg: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    return new RegExp(`(?:^|\\b|\\s)(?:${specialChars})*(?:${expr})(?:${specialChars})*(?:$|\\b|\\s)`, 'i')
}

const BAD_WORDS_EXCLUSIONS_RE = getRegexWithSpecChars(BAD_WORDS_EXCLUSIONS.reduce((prev, cur) => prev + (prev ? `|${cur}` : cur), ''))

/**
 * Check whether the input string contains bad words exclusions or not
 *
 * @param {string} word
 * @return {boolean}
 */
const checkBadWordsExclusions = (word) => {
    console.log({
        BAD_WORDS_EXCLUSIONS_RE,
    })
    return BAD_WORDS_EXCLUSIONS_RE.test(word)
}

module.exports = {
    checkBadWordsExclusions,
}
