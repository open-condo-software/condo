const slugify = require('slugify')

const conf = require('@open-condo/config')

const NUMBER_REGEXP = /(\d+)/g
const SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP = /[.,/\\#;"'\s|№$)(@]|(N°)/g
const SYMBOLS_TO_REMOVE_REGEXP = /[^\wа-яА-ЯёЁ]+/g
const EMOJI_REGEXP = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F680}-\u{1F6C5}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}-\u{1F251}\u{1F191}-\u{1F19A}]+/gu
const DELIMITER_IN_RESULT = '-'

const UNIT_NAME_NORMALIZATION_STEPS = [
    addSpaceBetweenWordsAndNumbers,
    replaceUnwantedSymbolsWithDelimiter,
    joinToOneLowercaseWordWithDelimiter,
]

function addSpaceBetweenWordsAndNumbers (str) {
    return str.replace(NUMBER_REGEXP, ' $1 ')
}

function replaceUnwantedSymbolsWithDelimiter (unitName) {
    return unitName
        .replace(SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP, DELIMITER_IN_RESULT)
        .replace(EMOJI_REGEXP, DELIMITER_IN_RESULT)
        .replace(SYMBOLS_TO_REMOVE_REGEXP, DELIMITER_IN_RESULT)
}

/**
 * replaces spaces with "-", does lowercase and replaces symbols with english analogues
 * @param unitName
 * @param locale
 * @returns {string}
 */
function joinToOneLowercaseWordWithDelimiter (unitName, locale = conf.DEFAULT_LOCALE) {
    return slugify(unitName, {
        replacement: DELIMITER_IN_RESULT,
        locale,
        strict: true,
        lower: true,
    })
}

function normalizeUnitName (unitName, locale = conf.DEFAULT_LOCALE) {
    locale = locale.toLowerCase()
    return UNIT_NAME_NORMALIZATION_STEPS.reduce((unitName, step) =>
        step(unitName, locale),
    unitName
    )
}

module.exports = {
    normalizeUnitName,
}