const conf = require('@open-condo/config')
const slugify = require('@open-condo/slugify')

const { RU_LOCALE } = require('../../common/constants/locale')

const JOINED_NUMBER_TO_WORD_REGEXP = /(\d+)(\D+)/g
const JOINED_WORD_TO_NUMBER_REGEXP = /(\D+)(\d+)/g
const SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP = /[.,/\\#;"'\s)(]|(N°)/g//\u200B-\u200D\uFEFF
const SYMBOLS_TO_REMOVE_REGEXP = /[^\wа-яА-ЯёЁ]+/g
const EMOJI_REGEXP = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F680}-\u{1F6C5}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}]+/gu
const DELIMITER_IN_RESULT = '-'

const DEFAULT_SLUGIFY_CHAR_MAP_FOR_RU_LOCALE = {
    'А': 'A',
    'Ё': 'E',
    'Е': 'E',
    'К': 'K',
    'М': 'M',
    'Н': 'H',
    'О': 'O',
    'Р': 'R',
    'С': 'C',
    'Т': 'T',
    'У': 'Y',
    'Х': 'X',
    'Ц': 'TC',
    'Щ': 'SCH',
    'Ъ': '',
    'Ы': 'IJ',
    'а': 'a',
    'е': 'e',
    'ё': 'e',
    'к': 'k',
    'м': 'm',
    'н': 'h',
    'о': 'o',
    'р': 'r',
    'с': 'c',
    'т': 't',
    'у': 'y',
    'х': 'x',
    'ц': 'tc',
    'щ': 'sch',
    'ъ': '',
    'ы': 'ij',

    'B': 'V', // eng B to V
    'b': 'v', // eng b to v
    'P': 'R', // eng P to R
    'p': 'r', // eng p to r
}

const addSpaceBetweenWordsAndNumbers = (str) => str
    .replace(JOINED_NUMBER_TO_WORD_REGEXP, '$1 $2')
    .replace(JOINED_WORD_TO_NUMBER_REGEXP, '$1 $2')

const replaceTrashSymbolsWithDelimiter = (unitName) => unitName
    .replace(SYMBOLS_TO_REPLACE_WITH_SPACE_REGEXP, DELIMITER_IN_RESULT)
    .replace(EMOJI_REGEXP, DELIMITER_IN_RESULT)
    .replace(SYMBOLS_TO_REMOVE_REGEXP, DELIMITER_IN_RESULT)

/**
 * replaces spaces with "-", removes invisible symbols, does lowercase and replaces symbols with english analogues
 * @param unitName
 * @param locale
 * @returns {string}
 */
const slug = (unitName, locale = conf.DEFAULT_LOCALE) => slugify(unitName, {
    replacement: DELIMITER_IN_RESULT,
    locale,
    lower: true,
})

slugify.extendLocale(RU_LOCALE, DEFAULT_SLUGIFY_CHAR_MAP_FOR_RU_LOCALE)

const normalizeUnitName = (unitName, locale = conf.DEFAULT_LOCALE) => {
    locale = locale.toLowerCase()

    const steps = [
        addSpaceBetweenWordsAndNumbers,
        replaceTrashSymbolsWithDelimiter,
        slug,
    ]

    return steps.reduce((unitName, step) =>
        step(unitName, locale),
    unitName
    )
}

module.exports = {
    normalizeUnitName,
}