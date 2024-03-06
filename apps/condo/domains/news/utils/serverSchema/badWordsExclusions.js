const BAD_WORDS_EXCLUSIONS = [
    'дебиторск*',
    'ипу',
    '*канал*',
    'муниципал*',
    'потребител*',
]

const SPECIAL_CHARS = /\d|[!@#$%^&*()[\];:'",.?\-_=+~`|]|a|(?:the)|(?:el)|(?:la)/

/**
 * This is a small addition to detect bad words exclusions, based on "bad-words-next"
 */
class BadWordsExclusions {
    #words = []
    #wordsExclusionsRe = null

    constructor ({ words } = {}) {
        if (!Array.isArray(words)) throw new Error('"words" must be of type "array"')

        this.#words = words

        this.#addWords(this.#words)
    }

    /**
     * Create regular expression by dictionary expression string
     * (This is a small function from the implementation of "bad-words-next")
     *
     * @param {string} exp
     * @return {RegExp}
     */
    #getRegexWithSpecChars (exp) {
        // "bad-words-next" may be return bad words with special chars
        const specialChars = SPECIAL_CHARS.toString().slice(1, -1)
        // not an user input. No ReDoS regexp expected
        // nosemreg: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        return new RegExp(`(?:^|\\b|\\s)(?:${specialChars})*(?:${exp})(?:${specialChars})*(?:$|\\b|\\s)`, 'i')
    }

    /**
     * Adds words to a regular expression to find exceptions
     * @param {string[]} words
     */
    #addWords (words) {
        this.#wordsExclusionsRe = this.#getRegexWithSpecChars(words.reduce((re, word) => {
            let exp = word
            if (exp.startsWith('*')) {
                exp = `[^\\s\\b^]*${exp.slice(1)}`
            }
            if (exp.endsWith('*')) {
                exp = `${exp.slice(0, -1)}[^\\s\\b$]*`
            }
            return re + (re ? `|${exp}` : exp)
        }, ''))
    }

    /**
     * Check whether the input string contains bad words exclusions or not
     *
     * @param {string} word
     * @return {boolean}
     */
    check (word) {
        if (!this.#wordsExclusionsRe) return false

        return this.#wordsExclusionsRe.test(word)
    }
}

module.exports = {
    BadWordsExclusions,
    BAD_WORDS_EXCLUSIONS,
}
