const PUNCTUATION_LETTERS = '.,:;!'
// NOTE: we don't want to parse dates, time, decimals and list sub items:
// 1. letter-spacesOrEmpty-punctuation-spacesOrEmpty-anything
// 2. digit-spacesOrEmpty-punctuation-spaces-letter
// This allows ass to pass anything like 22.02.2022, 5:30, 2.a, 2.b, 0.5
const PUNCTUATION_SEARCH_REGEX = new RegExp(`([\\p{L}] *[${PUNCTUATION_LETTERS}]+ *)|([\\p{N}] *[.,:;!]+ +)`, 'gmu')
const PUNCTUATION_PART_REGEX = new RegExp(` *[${PUNCTUATION_LETTERS}] *`, 'gm')

function normalizeText (text) {
    if (!text) return
    String(text).normalize()
    return text
        // remove unprintable letters without \n
        .replace(/[^\P{C}\n]+/gmu, '')
        // replace two or more \n to one \n
        .replace(/\n+/gm, '\n')
        // replace two or more spaces to one space
        .replace(/\p{Z}+/gu, ' ')
        // normalize punctuation between words, e.g: 'test  ,test' -> 'test, test'
        .replace(PUNCTUATION_SEARCH_REGEX, wordWithPunctuation => (
            `${wordWithPunctuation.replace(PUNCTUATION_PART_REGEX, punctuation => punctuation.trim())} `
        ))
        // normalize spaces in double quotes, e.g: "  a b c   " => "a b c"
        .replace(/"[^"]*"/gm, m => `"${m.split('"')[1].trim()}"`)
        // normalize open quote, e.g: "« " -> "«" (there can be no more than one space due to the previous replaces)
        .replace(/\p{Pi} /gmu, m => m[0])
        // normalize close quote, e.g: "» " -> "»"
        .replace(/ \p{Pf}/gmu, m => m[1])
        // trim each row
        .split('\n')
        .map(str => str.trim())
        .join('\n')
}

module.exports = {
    normalizeText,
}