const slugify = require('slugify')

const { AddressFromStringParser } = require('./parseAddressesFromString')
const { detectRomanNumerals, replaceRomanWithArabicNumbers } = require('./romanToArabic')

const JOINED_NUMBER_TO_WORD_REGEXP = /(\d+)(\D+)/g
const JOINED_WORD_TO_NUMBER_REGEXP = /(\D+)(\d+)/g
const SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP = /[.,#;"'\s)(]|(N°)/g
const SYMBOLS_TO_REMOVE_REGEXP = /[,.\\/\u200B-\u200D\uFEFF]/
const DELIMITER_IN_RESULT = '-'

const addSpaceBetweenWordsAndNumbers = (str) => str
    .replace(JOINED_NUMBER_TO_WORD_REGEXP, '$1 $2')
    .replace(JOINED_WORD_TO_NUMBER_REGEXP, '$1 $2')

const replaceTrashSymbolsWithSpace = (unitName) => unitName.replace(SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP, ' ')

const replaceRomanWithArabicNumbersAppropriately = (unitName) => {
    let excludedRomanSymbs = ['c', 'm', 'l', 'd']
    if (allStringIsRomanNumbers(unitName)) {
        excludedRomanSymbs = []
    }
    return replaceRomanWithArabicNumbers(unitName, excludedRomanSymbs)
}

/**
 * replaces spaces with "-", removes invisible symbols, does lowercase and replaces symbols with english analogues
 * @param unitName
 * @param locale
 * @returns {string}
 */
const slug = (unitName, locale) => {
    return slugify(unitName, {
        replacement: DELIMITER_IN_RESULT,
        remove: SYMBOLS_TO_REMOVE_REGEXP,
        locale,
        lower: true,
    })
}

const allStringIsRomanNumbers = (str) => {
    const arabicTest = detectRomanNumerals(str)
    if (!arabicTest || !arabicTest.length) {
        return false
    }

    let lastIndex = 0
    const takeSubBetweenMatches = (str, match) => str
        .substring(lastIndex, match.index)
        .trim(SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP)
        .trim(SYMBOLS_TO_REMOVE_REGEXP)

    for (const match of arabicTest) {
        if (takeSubBetweenMatches(str, match).length) {
            return false
        }
        lastIndex = match.index + match.value.length
    }
    return true
}

const normalizeUnitName = (unitName, locale = 'en') => {
    locale = locale.toLowerCase()
    const parser = new AddressFromStringParser(locale)
    const steps = [
        addSpaceBetweenWordsAndNumbers,
        replaceTrashSymbolsWithSpace,
        replaceRomanWithArabicNumbersAppropriately,
        (unitName) => unitName.toLowerCase(),
        (unitName) => parser.parseUnit(unitName).unitName,
        slug,
    ]

    return steps.reduce((unitName, step) =>
        step(unitName, locale),
    unitName
    )
}

module.exports = {
    normalizeUnitName,
    stringOnlyContainsRomanNumbers: allStringIsRomanNumbers,
}